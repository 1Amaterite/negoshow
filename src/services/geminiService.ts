import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from './dbService';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface ExtractedPrice {
  commodity: string;
  price: number;
}

export async function processBulletin(bulletinId: number, fileUrl: string) {
  try {
    console.log(`[GeminiService] Processing bulletin ${bulletinId} from URL: ${fileUrl}`);
    
    // 1. Fetch the file data
    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch file from ${fileUrl}: ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    
    // Fetch a dynamic fallback market in case coverage extraction isn't available yet
    const defaultMarket = await prisma.market.findFirst();
    const dynamicMarketId = defaultMarket?.id || 1;
    
    const buffer = Buffer.from(arrayBuffer);
    const base64Data = buffer.toString('base64');
    
    // Determine mime type (default to pdf if not found, since most bulletins are PDFs or images)
    const mimeType = response.headers.get('content-type') || 'application/pdf';

    // 2. Call Gemini API
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-3.5-flash',
      generationConfig: {
        responseMimeType: "application/json"
      }
    });
    
    const validCommodities = await prisma.commodity.findMany({ select: { name: true } });
    const commodityNames = validCommodities.map(c => c.name).join(', ');

    const prompt = `
      You are an expert data extraction assistant. Analyze this Philippine Department of Agriculture "DAILY PRICE INDEX" bulletin and extract the prevailing retail prices.
      
      CRITICAL INSTRUCTIONS:
      1. Look for the "PREVAILING RETAIL PRICE PER UNIT" column for the prices.
      2. If a price is listed as "n/a" or missing, skip that commodity entirely.
      3. You must ONLY extract prices for commodities that map to the following exact names:
         [${commodityNames}]
      4. Do not use English translations if our valid name is in Tagalog (e.g. use "Sibuyas Pula" instead of "Red Onions"). Match the commodity concept to our list.
      
      Format your response as a JSON array of objects, using this exact schema:
      [
        {
          "commodity": "Exact Name From List",
          "price": 120.50
        }
      ]
      
      Return an empty array [] if no matches are found.
    `;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType
        }
      }
    ]);
    
    const responseText = result.response.text().trim();
    
    // 3. Parse JSON
    let extractedData: ExtractedPrice[] = [];
    try {
      extractedData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('[GeminiService] Failed to parse JSON from Gemini:', responseText);
      throw new Error('Gemini output was not valid JSON');
    }

    if (!Array.isArray(extractedData)) {
      throw new Error('Gemini output was not a JSON array');
    }

    // 4. Algorithmic Safeguard Check
    let isOutlierDetected = false;
    const safeRecordsToCreate: any[] = [];

    for (const item of extractedData) {
      if (!item.commodity || typeof item.price !== 'number') continue;
      
      // Find commodity in DB (case insensitive if possible, or exact match)
      // Note: prisma in postgres is case-sensitive for contains unless we use mode: 'insensitive'
      // But for simple lookup, we'll try to match name.
      const commodity = await prisma.commodity.findFirst({
        where: {
          name: {
            contains: item.commodity,
            mode: 'insensitive'
          }
        }
      });

      if (!commodity) {
        console.log(`[GeminiService] Commodity not found in DB: ${item.commodity}, skipping.`);
        continue;
      }

      // Find the latest price for this commodity
      const latestPriceRecord = await prisma.retailPrice.findFirst({
        where: { commodityId: commodity.id },
        orderBy: { observedDate: 'desc' }
      });

      if (latestPriceRecord) {
        const latestPrice = latestPriceRecord.price;
        // Check for 100% jump/drop
        // Math.abs(new - old) / old > 1 (which is 100%)
        const percentChange = Math.abs(item.price - latestPrice) / latestPrice;
        
        if (percentChange > 1) {
          console.warn(`[GeminiService] Outlier detected for ${commodity.name}! Old: ${latestPrice}, New: ${item.price}`);
          isOutlierDetected = true;
          // We break or continue based on strategy. We'll mark the whole bulletin as REQUIRES_MANUAL_REVIEW
        }
      }

      safeRecordsToCreate.push({
        commodityId: commodity.id,
        marketId: dynamicMarketId,
        price: item.price,
        observedDate: new Date(),
        sourceBulletinId: bulletinId
      });
    }

    // 5. Database Update
    if (isOutlierDetected || safeRecordsToCreate.length === 0) {
      // Flag bulletin
      await prisma.bulletinRecord.update({
        where: { id: bulletinId },
        data: { processedStatus: 'REQUIRES_MANUAL_REVIEW' }
      });
      console.log(`[GeminiService] Bulletin ${bulletinId} flagged for manual review.`);
    } else {
      // Save data and mark PROCESSED
      // Use transaction to ensure data integrity
      await prisma.$transaction([
        prisma.retailPrice.createMany({ data: safeRecordsToCreate }),
        prisma.bulletinRecord.update({
          where: { id: bulletinId },
          data: { processedStatus: 'PROCESSED' }
        })
      ]);
      console.log(`[GeminiService] Bulletin ${bulletinId} processed successfully with ${safeRecordsToCreate.length} prices.`);
    }

  } catch (error) {
    console.error(`[GeminiService] Error processing bulletin ${bulletinId}:`, error);
    // If it completely fails, flag for manual review
    await prisma.bulletinRecord.update({
      where: { id: bulletinId },
      data: { processedStatus: 'REQUIRES_MANUAL_REVIEW' }
    });
  }
}

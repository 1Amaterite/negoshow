import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from './dbService';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const DEFAULT_MARKET_ID = 1; // Pasay City Talipapa

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
    const buffer = Buffer.from(arrayBuffer);
    const base64Data = buffer.toString('base64');
    
    // Determine mime type (default to pdf if not found, since most bulletins are PDFs or images)
    const mimeType = response.headers.get('content-type') || 'application/pdf';

    // 2. Call Gemini API
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const validCommodities = await prisma.commodity.findMany({ select: { name: true } });
    const commodityNames = validCommodities.map(c => c.name).join(', ');

    const prompt = `
      Analyze this market bulletin and extract the prices for the commodities listed.
      You must return the data STRICTLY as a JSON array of objects.
      Do not include any markdown formatting like \`\`\`json.
      
      CRITICAL: You must ONLY use the following exact commodity names if they appear in the bulletin (or translate to them):
      [${commodityNames}]
      Do not use English translations if the valid name is in Tagalog (e.g. use "Sibuyas Pula" instead of "Red Onions").
      
      Format example:
      [
        {"commodity": "Sibuyas Pula", "price": 120},
        {"commodity": "Bawang", "price": 300}
      ]
      
      If you cannot find any prices matching the list, return an empty array [].
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
    
    // Strip markdown formatting if Gemini still included it
    const jsonString = responseText.replace(/^```(json)?\n?/i, '').replace(/\n?```$/i, '');
    
    // 3. Parse JSON
    let extractedData: ExtractedPrice[] = [];
    try {
      extractedData = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('[GeminiService] Failed to parse JSON from Gemini:', jsonString);
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
        marketId: DEFAULT_MARKET_ID,
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

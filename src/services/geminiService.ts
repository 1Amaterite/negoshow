import { GoogleGenerativeAI, SchemaType, GenerationConfig } from '@google/generative-ai';
import { prisma } from './dbService';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface ExtractedPrice {
  commodity: string;
  price: number;
  confidenceScore: number;
}

interface GeminiExtractionResult {
  bulletinDate?: string;
  extractedPrices: ExtractedPrice[];
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
    
    // Fetch a default market for location reference
    const defaultMarket = await prisma.market.findFirst();
    const dynamicMarketId = defaultMarket?.id || 1;
    
    const buffer = Buffer.from(arrayBuffer);
    const base64Data = buffer.toString('base64');
    
    const mimeType = response.headers.get('content-type') || 'application/pdf';

    const validCommodities = await prisma.commodity.findMany({ select: { name: true } });
    const commodityNames = validCommodities.map(c => c.name).join(', ');

    const prompt = `
      You are an expert data analyst for Philippine agricultural commodities. Analyze this Department of Agriculture (DA) "DAILY PRICE INDEX" bulletin document and extract the prevailing retail prices.
      
      TARGET DATABASE COMMODITIES:
      [${commodityNames}]
      
      COMMODITY MAPPING RULES:
      - "Red Onion, Local" or "Red Onion, Imported" -> Map to target: "Red Onions"
      - "White Onion, Local" or "White Onion, Imported" -> Map to target: "White Onions"
      - "Garlic, Native/Local" or "Garlic, Imported" -> Map to target: "Garlic"
      - "Ginger, Local" or "Ginger, Imported" -> Map to target: "Ginger"
      - "White Potato, Local" or "White Potato, Imported" -> Map to target: "Potatoes"
      
      DISAMBIGUATION & DEDUPLICATION RULES FOR MULTIPLE SUB-TYPES:
      1. For each target commodity, produce EXACTLY ONE output entry.
      2. PREFER LOCAL PRODUCE: If a commodity has both "Local" (or "Native") and "Imported" rows with valid numerical prices:
         - Select the "Local" or "Native" price as the primary prevailing price (e.g. Red Onion, Local @ 107.87).
      3. FALLBACK TO IMPORTED: If "Local" is "n/a" or missing, use the "Imported (Medium)" price, or the first valid imported price.
      4. SIZES / SPECIFICATIONS: If multiple sizes (Medium, Large, 13-15 pcs/kg) are listed, pick "Medium" or the first available valid price.
      5. IGNORE MISSING: If a price is listed as "n/a", ignore that row.
      
      DOCUMENT DATE:
      Extract the official date printed in the document header (e.g. "Wednesday, July 22, 2026") formatted as "YYYY-MM-DD" in the bulletinDate field.
      
      EXPECTED JSON OUTPUT FORMAT:
      Output a strict JSON object containing "bulletinDate" and "extractedPrices" array:
      {
        "bulletinDate": "2026-07-22",
        "extractedPrices": [
          {
            "commodity": "Red Onions",
            "price": 107.87,
            "confidenceScore": 95
          },
          {
            "commodity": "White Onions",
            "price": 103.75,
            "confidenceScore": 95
          }
        ]
      }
    `;

    // 2. Call Gemini API with Fallbacks
    const fallbackModels = [
      'gemini-3.5-flash-lite',
      'gemini-3.1-flash-lite',
      'gemini-2.5-flash-lite',
      'gemini-3.5-flash',
      'gemini-2.5-flash',
      'gemini-3-flash'
    ];

    const generationConfig: GenerationConfig = {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          bulletinDate: { type: SchemaType.STRING, description: "Formatted as YYYY-MM-DD" },
          extractedPrices: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                commodity: { type: SchemaType.STRING },
                price: { type: SchemaType.NUMBER },
                confidenceScore: { type: SchemaType.NUMBER, description: "A score from 0 to 100 representing how confident you are in this extracted price based on document legibility" }
              },
              required: ["commodity", "price", "confidenceScore"]
            }
          }
        },
        required: ["bulletinDate", "extractedPrices"]
      }
    };

    let rawResponseText = "";
    let lastError: any = null;

    for (const modelName of fallbackModels) {
      try {
        console.log(`[GeminiService] Attempting extraction with model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName, generationConfig });
        
        const result = await model.generateContent([
          prompt,
          {
            inlineData: {
              data: base64Data,
              mimeType
            }
          }
        ]);
        
        rawResponseText = result.response.text().trim();
        console.log(`[GeminiService] Successfully extracted data using model: ${modelName}`);
        break; // Stop at first successful model
      } catch (error: any) {
        console.warn(`[GeminiService] Model ${modelName} failed. Reason: ${error.message}`);
        lastError = error;
      }
    }

    if (!rawResponseText) {
      throw new Error(`All Gemini fallback models failed due to quota or access limits. Last error: ${lastError?.message}`);
    }
    // Strip potential markdown code fences if generated
    const cleanJsonText = rawResponseText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```$/i, '')
      .trim();
    
    // 3. Parse JSON
    let parsedResult: GeminiExtractionResult = { extractedPrices: [] };
    try {
      const json = JSON.parse(cleanJsonText);
      if (Array.isArray(json)) {
        parsedResult = { extractedPrices: json };
      } else {
        parsedResult = json;
      }
    } catch (parseError) {
      console.error('[GeminiService] Failed to parse JSON from Gemini:', rawResponseText);
      throw new Error('Gemini output was not valid JSON');
    }

    const extractedPrices = parsedResult.extractedPrices || [];
    if (!Array.isArray(extractedPrices)) {
      throw new Error('Gemini output extractedPrices was not an array');
    }

    // Determine observed date from document header or fallback to now
    let observedDate = new Date();
    if (parsedResult.bulletinDate) {
      const parsedDate = new Date(parsedResult.bulletinDate);
      if (!isNaN(parsedDate.getTime())) {
        observedDate = parsedDate;
      }
    }

    // 4. Algorithmic Safeguard & Outlier Detection
    let isOutlierDetected = false;
    let outlierReason = '';
    const recordsToCreate: any[] = [];

    const SYNONYMS: Record<string, string[]> = {
      'Red Onions': ['red onion', 'red onions', 'sibuyas pula'],
      'White Onions': ['white onion', 'white onions', 'sibuyas puti'],
      'Garlic': ['garlic', 'bawang'],
      'Ginger': ['ginger', 'luya'],
      'Potatoes': ['potatoes', 'potato', 'white potato', 'patatas'],
    };

    // Pre-fetch all commodities to prevent N+1 queries inside loop
    const allCommodities = await prisma.commodity.findMany();

    for (const item of extractedPrices) {
      if (!item.commodity || typeof item.price !== 'number' || isNaN(item.price)) continue;
      
      const targetName = item.commodity.trim();

      let commodity = allCommodities.find(c => 
        c.name.toLowerCase() === targetName.toLowerCase()
      );

      if (!commodity) {
        commodity = allCommodities.find(c => {
          const syns = SYNONYMS[c.name] || [];
          return syns.some(s => targetName.toLowerCase().includes(s));
        });
      }

      if (!commodity) {
        console.log(`[GeminiService] Commodity not found in DB: ${item.commodity}, skipping.`);
        continue;
      }

      // Check for 20% price jump/drop vs latest verified baseline
      const latestPriceRecord = await prisma.retailPrice.findFirst({
        where: { commodityId: commodity.id, isVerified: true },
        orderBy: { observedDate: 'desc' }
      });

      const roundedPrice = Number(item.price.toFixed(2));
      let recordFlagged = false;
      let recordFlagReason = null;

      if (latestPriceRecord && latestPriceRecord.price > 0) {
        const latestPrice = latestPriceRecord.price;
        const percentChange = Math.abs(roundedPrice - latestPrice) / latestPrice;
        
        if (percentChange > 0.20) {
          recordFlagged = true;
          recordFlagReason = `Price shifted by ${(percentChange * 100).toFixed(1)}% vs previous baseline (₱${latestPrice.toFixed(2)} to ₱${roundedPrice.toFixed(2)})`;
          isOutlierDetected = true;
          outlierReason = `Significant price shift detected for ${commodity.name}: Previous ₱${latestPrice.toFixed(2)}, Extracted ₱${roundedPrice.toFixed(2)}`;
          console.warn(`[GeminiService] ${outlierReason}`);
        }
      }
      
      if (item.confidenceScore < 90) {
        recordFlagged = true;
        const confidenceMsg = `Low AI Confidence (${item.confidenceScore}%)`;
        recordFlagReason = recordFlagReason ? `${recordFlagReason}. ${confidenceMsg}` : confidenceMsg;
        isOutlierDetected = true;
        outlierReason = `Low confidence score detected for ${commodity.name}.`;
      }

      recordsToCreate.push({
        commodityId: commodity.id,
        marketId: dynamicMarketId,
        price: roundedPrice,
        observedDate: observedDate,
        sourceBulletinId: bulletinId,
        isVerified: false,
        confidenceScore: item.confidenceScore,
        isFlagged: recordFlagged,
        flagReason: recordFlagReason
      });
    }

    // 5. Database Save & Notification
    if (recordsToCreate.length > 0) {
      // Create price records staging (isVerified: false) so Admin can review in Validation tab
      await prisma.retailPrice.createMany({ data: recordsToCreate });
    }

    if (isOutlierDetected) {
      await prisma.bulletinRecord.update({
        where: { id: bulletinId },
        data: { processedStatus: 'REQUIRES_MANUAL_REVIEW' }
      });
      // Create an alert for admin dashboard
      await prisma.adminAlert.create({
        data: {
          message: outlierReason,
          isRead: false
        }
      });
      console.log(`[GeminiService] Bulletin ${bulletinId} processed with warnings. Alert created.`);
    } else {
      await prisma.bulletinRecord.update({
        where: { id: bulletinId },
        data: { processedStatus: 'PROCESSED' }
      });
      console.log(`[GeminiService] Bulletin ${bulletinId} processed successfully with ${recordsToCreate.length} prices.`);
    }

  } catch (error: any) {
    console.error(`[GeminiService] Error processing bulletin ${bulletinId}:`, error);
    await prisma.bulletinRecord.update({
      where: { id: bulletinId },
      data: { processedStatus: 'REQUIRES_MANUAL_REVIEW' }
    });
    
    let friendlyErrorMessage = error.message || "Unknown error occurred";
    if (friendlyErrorMessage.includes('429 Too Many Requests') || friendlyErrorMessage.includes('Quota exceeded')) {
      friendlyErrorMessage = "API Quota Exceeded. Please check your billing or wait a moment.";
    } else if (friendlyErrorMessage.length > 200) {
      // Split out the massive JSON payload Google sometimes returns
      friendlyErrorMessage = friendlyErrorMessage.split(/\[{"@type"/)[0].substring(0, 200).trim() + "...";
    }

    // Create an alert for admin dashboard explaining why it failed
    await prisma.adminAlert.create({
      data: {
        message: `AI Processing failed for Bulletin ID ${bulletinId}: ${friendlyErrorMessage}`,
        isRead: false
      }
    });
  }
}

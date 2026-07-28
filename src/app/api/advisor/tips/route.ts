import { NextResponse } from "next/server";
import { PrismaClient } from '@prisma/client';
import { SchemaType, Schema } from "@google/generative-ai";

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic'; // Force dynamic since we read searchParams from req.url
export const maxDuration = 60; // Allow 60s for Gemini API

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const lang = searchParams.get('lang') || 'en';

    // 1. Fetch ALL commodities (not just 5) with recent prices
    const commodities = await prisma.commodity.findMany({
      include: {
        retailPrices: {
          where: { isVerified: true },
          orderBy: { observedDate: 'desc' },
          take: 30 // Get up to 30 recent prices to calculate avg
        }
      }
    });

    // 2. Calculate dynamic context for the LLM
    const contextLines = commodities.map((c: any) => {
      const prices = c.retailPrices;
      if (prices.length === 0) return null;
      const currentPrice = prices[0].price;
      const avgPrice = prices.reduce((acc: number, p: any) => acc + p.price, 0) / prices.length;
      const diff = currentPrice - avgPrice;
      const diffPct = (diff / avgPrice) * 100;
      
      let trendStr = "stable";
      if (diffPct > 5) trendStr = `spiked by ${diffPct.toFixed(1)}% compared to 30-day average`;
      else if (diffPct < -5) trendStr = `dropped by ${Math.abs(diffPct).toFixed(1)}% compared to 30-day average`;
      
      return `ID: ${c.id} | ${c.name}: Current price ₱${currentPrice.toFixed(2)}/kg. Trend: ${trendStr}.`;
    }).filter(Boolean);

    const contextStr = contextLines.join("\n");

    const prompt = `You are an expert market analyst and procurement advisor for local market vendors in the Philippines.
Here is today's commodity data, including 30-day price trends:
${contextStr}

Your task: Generate exactly 3 highly actionable procurement tips for today.
Rules:
1. FOCUS ON OUTLIERS: Prioritize commodities with the largest price drops (opportunities to increase margin/stock up) or highest spikes (signals to buy less or find alternatives).
2. BE SPECIFIC: You MUST mention the exact commodity names, current prices, and trend percentages provided in the data.
3. ADD VENDOR WISDOM: Combine the data with practical vendor knowledge (e.g., consider perishability—advise stocking up on non-perishables if cheap, but caution against overbuying highly perishable goods even if prices drop).
4. NO FLUFF: Keep it direct and strictly about procurement strategy.`;

    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    
    // Strict schema ensuring commodityId is returned for deep linking
    const responseSchema: Schema = {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          commodityId: {
            type: SchemaType.INTEGER,
            description: "The integer ID of the commodity this tip is about, pulled from the provided context."
          },
          icon: {
            type: SchemaType.STRING,
            description: "A valid Lucide icon that matches the tip's sentiment.",
            format: "enum",
            enum: ["ShoppingCart", "TrendingDown", "Lightbulb", "MapPin", "Clock", "CheckCircle", "AlertTriangle", "Flame", "Zap"]
          },
          title: {
            type: SchemaType.STRING,
            description: `Short catchy title (max 5 words) in ${lang === 'tl' ? 'Tagalog' : 'English'}`
          },
          body: {
            type: SchemaType.STRING,
            description: `Brief actionable tip mentioning exact prices or commodities (max 2 sentences) in ${lang === 'tl' ? 'Tagalog' : 'English'}`
          }
        },
        required: ["commodityId", "icon", "title", "body"]
      }
    };

    const fallbackModels = [
      'gemini-3.1-flash-lite',
      'gemini-3.5-flash-lite',
      'gemini-flash-lite-latest',
      'gemini-3-flash-preview',
      'gemini-3.6-flash',
      'gemini-flash-latest'
    ];

    let text = "";
    for (const modelName of fallbackModels) {
      try {
        const model = genAI.getGenerativeModel({ 
          model: modelName, 
          generationConfig: { 
            temperature: 0.7,
            responseMimeType: "application/json",
            responseSchema
          } 
        });
        const result = await model.generateContent(prompt);
        text = result.response.text();
        if (text) break;
      } catch (err) {
        console.warn(`[AdvisorRoute] Model ${modelName} failed, trying next fallback.`);
      }
    }
    
    if (!text) throw new Error("All Gemini fallback models failed for advisor tips");
    const tips = JSON.parse(text);

    return NextResponse.json(tips);
  } catch (error) {
    console.error("Failed to generate AI tips:", error);
    // Fallback tips if AI fails (now including a fake commodityId so the UI doesn't crash)
    const fallback = [
      { commodityId: 1, icon: "ShoppingCart", title: "Buy in Bulk", body: "Check the 30-day baseline to see if it's a good time to buy in bulk." },
      { commodityId: 2, icon: "MapPin", title: "Compare Markets", body: "Prices vary by market. Explore markets further from the center." },
      { commodityId: 3, icon: "Clock", title: "Monitor Trends", body: "Always monitor 7-day trends for early signs of price spikes." }
    ];
    return NextResponse.json(fallback);
  }
}

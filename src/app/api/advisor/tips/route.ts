import { NextResponse } from "next/server";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const maxDuration = 60; // Allow 60s for Gemini API

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const lang = searchParams.get('lang') || 'en';

    // Fetch the latest 5 commodities
    const commodities = await prisma.commodity.findMany({
      include: {
        retailPrices: {
          orderBy: { observedDate: 'desc' },
          take: 5
        }
      },
      take: 5
    });

    // Provide context to Gemini
    const contextStr = commodities.map((c: any) => 
      `${c.name}: Latest price around ₱${c.retailPrices[0]?.price || 'unknown'} / kg.`
    ).join("\n");

    const prompt = `You are an expert market analyst and supply chain advisor for market vendors in the Philippines.
Based on the following current commodity prices:
${contextStr}

Generate exactly 3 short, highly actionable and data-driven quick tips for market vendors to optimize their procurement today. Do not use generic advice, make it sound dynamic.
Return the result as a raw JSON array of objects (do not wrap in markdown or backticks).
Each object MUST have:
"icon": A valid Lucide React icon name (Choose one of: "ShoppingCart", "TrendingDown", "Lightbulb", "MapPin", "Clock", "CheckCircle", "AlertTriangle")
"title": A short catchy title (max 5 words) in ${lang === 'tl' ? 'Tagalog' : 'English'}
"body": A brief actionable tip (max 2 sentences) in ${lang === 'tl' ? 'Tagalog' : 'English'}

Example format:
[
  { "icon": "Lightbulb", "title": "Buy Garlic Now", "body": "Garlic prices are low. Stock up for the week." }
]`;

    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash", generationConfig: { temperature: 0.7 } });
    
    const result = await model.generateContent(prompt);
    let text = result.response.text();
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const tips = JSON.parse(text);

    return NextResponse.json(tips);
  } catch (error) {
    console.error("Failed to generate AI tips:", error);
    // Fallback tips if AI fails
    const fallback = [
      { icon: "ShoppingCart", title: "Buy in Bulk", body: "Check the 30-day baseline to see if it's a good time to buy in bulk." },
      { icon: "MapPin", title: "Compare Markets", body: "Prices vary by market. Explore markets further from the center." },
      { icon: "Clock", title: "Monitor Trends", body: "Always monitor 7-day trends for early signs of price spikes." }
    ];
    return NextResponse.json(fallback);
  }
}

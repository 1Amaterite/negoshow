import { NextResponse } from "next/server";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';
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

    // Provide richer context to Gemini
    const contextStr = commodities.map((c: any) => 
      `${c.name} (${c.tagalog}): Current price ₱${c.retailPrices[0]?.price || 'unknown'}/kg.`
    ).join("\n");

    const prompt = `You are a savvy, data-driven market analyst advising market vendors in the Philippines.
Here is the latest data for key commodities:
${contextStr}

Analyze the data and generate exactly 3 highly actionable, specific, and punchy tips for procurement today.
Do NOT give generic advice. You MUST mention specific commodities and their exact prices in your tips (e.g., "At ₱120/kg, Garlic is a steal right now"). Use an urgent, helpful tone.

Return the result as a raw JSON array of objects (do not wrap in markdown or backticks).
Each object MUST have:
"icon": A valid Lucide React icon name (Choose one of: "ShoppingCart", "TrendingDown", "Lightbulb", "MapPin", "Clock", "CheckCircle", "AlertTriangle", "Flame", "Zap")
"title": A short catchy title (max 5 words) in ${lang === 'tl' ? 'Tagalog' : 'English'}
"body": A brief actionable tip mentioning exact prices or commodities (max 2 sentences) in ${lang === 'tl' ? 'Tagalog' : 'English'}

Example format:
[
  { "icon": "Flame", "title": "Garlic Prices Dropped!", "body": "Garlic is currently at ₱120/kg. Stock up your inventory now before prices rebound." }
]`;

    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3.5-flash", 
      generationConfig: { 
        temperature: 0.7,
        responseMimeType: "application/json"
      } 
    });
    
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
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

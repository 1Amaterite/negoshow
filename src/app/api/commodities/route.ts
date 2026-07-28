import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const commodities = await prisma.commodity.findMany({
      include: {
        retailPrices: {
          where: { isVerified: true },
          orderBy: { observedDate: 'desc' },
          take: 30 // Get last 30 days to calculate baseline/30d
        },
        vendorChecks: {
          where: { isVerified: true },
          orderBy: { checkedAt: 'desc' },
          take: 50,
          include: { market: true },
        },
      }
    });

    const data = commodities.map(c => {
      // Calculate current baseline (latest price)
      const latestPrice = c.retailPrices[0]?.price || 0;
      
      // Calculate 30-day baseline average
      const prices30d = c.retailPrices.map(rp => rp.price);
      const avg30d = prices30d.length > 0 
        ? prices30d.reduce((a, b) => a + b, 0) / prices30d.length 
        : latestPrice;

      // Calculate average of recent vendor quotes (asking price)
      const vendorQuotes = c.vendorChecks.map(vc => vc.checkedPrice);
      const vendorQuoteAvg = vendorQuotes.length > 0
        ? vendorQuotes.reduce((a, b) => a + b, 0) / vendorQuotes.length
        : latestPrice; // fallback if no quotes

      // Calculate trend and change based on Vendor Quotes vs Baseline
      const changeAbs = vendorQuoteAvg - latestPrice;
      const change = latestPrice > 0 ? (changeAbs / latestPrice) * 100 : 0;
      
      let trend = "stable";
      if (change > 2) trend = "up";
      if (change < -2) trend = "down";

      let volatility = "Low";
      if (Math.abs(change) > 5) volatility = "Medium";
      if (Math.abs(change) > 10) volatility = "High";

      const sources: {name: string, price: number, distance?: string}[] = [];
      if (c.vendorChecks.length > 0) {
        const marketPrices: Record<string, number[]> = {};
        c.vendorChecks.forEach((vc: any) => {
          const mName = vc.market?.name || "General Market";
          if (!marketPrices[mName]) marketPrices[mName] = [];
          marketPrices[mName].push(vc.checkedPrice);
        });
        
        for (const [mName, prices] of Object.entries(marketPrices)) {
          const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
          sources.push({ name: mName, price: avg, distance: "2.4 km" });
        }
        // Sort by lowest price first
        sources.sort((a, b) => a.price - b.price);
      } else {
        sources.push({name: "General Market", price: latestPrice, distance: "-"});
      }

      return {
        id: c.name.toLowerCase().replace(" ", "-"),
        name: c.name,
        tagalog: c.name,
        shortLabel: c.name,
        image: c.imageUrl,
        baseline: Math.round(latestPrice),
        baseline30d: Math.round(avg30d),
        vendorQuoteAvg: Math.round(vendorQuoteAvg),
        trend,
        change: Math.round(change),
        changeAbs: Math.round(changeAbs),
        volatility,
        primarySource: "General Market",
        sources,
        isMock: c.retailPrices[0]?.sourceBulletinId === null
      };
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch commodities:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

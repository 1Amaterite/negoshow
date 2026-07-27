import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const commodityIdStr = searchParams.get('commodityId');
    const daysStr = searchParams.get('days') || '30';
    const location = searchParams.get('location') || 'all';
    
    if (!commodityIdStr) {
      return NextResponse.json({ error: "Missing commodityId" }, { status: 400 });
    }

    let commodityId = parseInt(commodityIdStr, 10);
    if (isNaN(commodityId)) {
      const c = await prisma.commodity.findFirst({
        where: { name: { contains: commodityIdStr.replace(/-/g, ' '), mode: 'insensitive' } }
      });
      if (!c) return NextResponse.json({ error: "Commodity not found" }, { status: 404 });
      commodityId = c.id;
    }

    const days = parseInt(daysStr, 10);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const whereClause: any = {
      commodityId,
      isVerified: true,
      observedDate: { gte: cutoffDate }
    };

    if (location !== 'all') {
      whereClause.sourceBulletin = {
        coverage: { contains: location, mode: 'insensitive' }
      };
    }

    const prices = await prisma.retailPrice.findMany({
      where: whereClause,
      orderBy: { observedDate: 'asc' },
      include: { sourceBulletin: true }
    });

    const vendorWhereClause: any = {
      commodityId,
      checkedAt: { gte: cutoffDate }
    };

    if (location !== 'all') {
      vendorWhereClause.market = {
        name: { contains: location, mode: 'insensitive' }
      };
    }

    const vendorChecks = await prisma.vendorCheck.findMany({
      where: vendorWhereClause,
      orderBy: { checkedAt: 'asc' },
      include: { market: true }
    });

    // Fetch the most recent baseline price prior to the cutoff date to use as a fallback
    const priorPriceRecord = await prisma.retailPrice.findFirst({
      where: {
        commodityId,
        isVerified: true,
        observedDate: { lt: cutoffDate },
        ...(location !== 'all' ? { sourceBulletin: { coverage: { contains: location, mode: 'insensitive' } } } : {})
      },
      orderBy: { observedDate: 'desc' }
    });

    let lastKnownBaseline = priorPriceRecord?.price || null;

    if (prices.length === 0 && vendorChecks.length === 0) {
      return NextResponse.json({ chartData: [], kpi: { median: 0, highest: 0, lowest: 0 } });
    }

    // Group by date
    const dailyData: Record<string, { baseline: number[], asking: number[] }> = {};
    
    for (const p of prices) {
      const dStr = p.observedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!dailyData[dStr]) dailyData[dStr] = { baseline: [], asking: [] };
      dailyData[dStr].baseline.push(p.price);
    }

    for (const v of vendorChecks) {
      const dStr = v.checkedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!dailyData[dStr]) dailyData[dStr] = { baseline: [], asking: [] };
      dailyData[dStr].asking.push(v.checkedPrice);
    }

    // Generate array of all days in the timeframe
    const allDays = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(cutoffDate);
      d.setDate(d.getDate() + i + 1);
      allDays.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    }

    const chartData = allDays.map(date => {
      const vals = dailyData[date] || { baseline: [], asking: [] };
      
      const avgBaseline = vals.baseline.length > 0 ? vals.baseline.reduce((a, b) => a + b, 0) / vals.baseline.length : null;
      if (avgBaseline !== null) {
        lastKnownBaseline = avgBaseline;
      }
      
      const avgAsking = vals.asking.length > 0 ? vals.asking.reduce((a, b) => a + b, 0) / vals.asking.length : null;
      
      return { 
        date, 
        price: lastKnownBaseline !== null ? Math.round(lastKnownBaseline) : null,
        askingPrice: avgAsking !== null ? Math.round(avgAsking) : null
      };
    });

    const allPrices = prices.map(p => p.price).sort((a, b) => a - b);
    const lowest = allPrices[0];
    const highest = allPrices[allPrices.length - 1];
    
    let median = 0;
    const mid = Math.floor(allPrices.length / 2);
    if (allPrices.length % 2 === 0) {
      median = (allPrices[mid - 1] + allPrices[mid]) / 2;
    } else {
      median = allPrices[mid];
    }

    return NextResponse.json({
      chartData,
      kpi: {
        median: Math.round(median),
        highest: Math.round(highest),
        lowest: Math.round(lowest)
      }
    });

  } catch (error) {
    console.error("Failed to fetch descriptive prices:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

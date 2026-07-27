import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const daysStr = searchParams.get('days') || '7';
    
    const days = parseInt(daysStr, 10);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const checks = await prisma.vendorCheck.findMany({
      where: {
        checkedAt: { gte: cutoffDate }
      },
      include: {
        commodity: true,
        market: true
      },
      orderBy: { checkedAt: 'asc' }
    });

    const retailPrices = await prisma.retailPrice.findMany({
      where: {
        observedDate: { gte: cutoffDate },
        isVerified: true
      }
    });

    // Compute average baseline per commodity
    const baselineMap: Record<number, { sum: number, count: number }> = {};
    for (const rp of retailPrices) {
      if (!baselineMap[rp.commodityId]) baselineMap[rp.commodityId] = { sum: 0, count: 0 };
      baselineMap[rp.commodityId].sum += rp.price;
      baselineMap[rp.commodityId].count += 1;
    }
    const avgBaselineMap: Record<number, number> = {};
    for (const [cId, stats] of Object.entries(baselineMap)) {
      avgBaselineMap[parseInt(cId)] = stats.sum / stats.count;
    }

    // 1. Bar chart data (checks per market)
    const marketCounts: Record<string, number> = {};
    const commodityCounts: Record<string, number> = {};
    const timelineCounts: Record<string, number> = {};
    const overBaselineCounts: Record<string, number> = {};
    
    let checksToday = 0;
    const todayStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    for (const check of checks) {
      const mName = check.market?.name || 'Unknown Market';
      const cName = check.commodity?.name || 'Unknown Commodity';
      const dStr = check.checkedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      marketCounts[mName] = (marketCounts[mName] || 0) + 1;
      commodityCounts[cName] = (commodityCounts[cName] || 0) + 1;
      timelineCounts[dStr] = (timelineCounts[dStr] || 0) + 1;
      
      if (dStr === todayStr) {
        checksToday++;
      }

      const baseline = avgBaselineMap[check.commodityId];
      if (baseline && check.checkedPrice > baseline) {
        overBaselineCounts[mName] = (overBaselineCounts[mName] || 0) + 1;
      }
    }

    const marketBarData = Object.keys(marketCounts).map(name => ({
      name,
      checks: marketCounts[name]
    })).sort((a, b) => b.checks - a.checks).slice(0, 5); // top 5 markets

    const timelineData = Object.keys(timelineCounts).map(date => ({
      date,
      checks: timelineCounts[date]
    }));

    // Find most checked commodity
    let mostCheckedCommodity = "N/A";
    let maxC = 0;
    for (const [c, count] of Object.entries(commodityCounts)) {
      if (count > maxC) {
        maxC = count;
        mostCheckedCommodity = c;
      }
    }

    // Find market with most checks
    let topMarket = "N/A";
    let maxM = 0;
    for (const [m, count] of Object.entries(marketCounts)) {
      if (count > maxM) {
        maxM = count;
        topMarket = m;
      }
    }

    const overBaselineData = Object.keys(overBaselineCounts).map(name => ({
      name,
      overCount: overBaselineCounts[name]
    })).sort((a, b) => b.overCount - a.overCount);

    return NextResponse.json({
      marketBarData,
      timelineData,
      overBaselineData,
      kpi: {
        checksToday,
        mostCheckedCommodity,
        topMarket
      }
    });

  } catch (error) {
    console.error("Failed to fetch activity analytics:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

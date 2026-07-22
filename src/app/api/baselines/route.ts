import { NextResponse } from 'next/server';
import prisma from '@/services/dbService';

export async function GET() {
  try {
    const allPrices = await prisma.retailPrice.findMany({
      where: { isVerified: true },
      orderBy: { observedDate: 'desc' },
      include: { commodity: true, market: true }
    });
    
    // Deduplicate to get the latest per commodity and market
    const latestBaselines = [];
    const seen = new Set();
    for (const b of allPrices) {
      const key = `${b.commodityId}-${b.marketId}`;
      if (!seen.has(key)) {
        seen.add(key);
        latestBaselines.push(b);
      }
    }

    return NextResponse.json(latestBaselines);
  } catch (error) {
    console.error('Error fetching baselines:', error);
    return NextResponse.json({ error: 'Failed to fetch baselines' }, { status: 500 });
  }
}

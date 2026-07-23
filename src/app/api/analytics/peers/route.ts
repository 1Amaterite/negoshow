import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const commodityIdStr = searchParams.get('commodityId');
    
    if (!commodityIdStr) {
      return NextResponse.json({ error: "Missing commodityId" }, { status: 400 });
    }

    const c = await prisma.commodity.findFirst({
        where: { name: { contains: commodityIdStr.replace('-', ' '), mode: 'insensitive' } },
        include: {
            retailPrices: {
                orderBy: { observedDate: 'desc' },
                take: 1
            },
            vendorChecks: {
                orderBy: { checkedAt: 'desc' },
                take: 10
            }
        }
    });

    if (!c) {
        return NextResponse.json({ error: "Commodity not found" }, { status: 404 });
    }

    const baseline = c.retailPrices[0]?.price || 0;
    
    const peerPrices = c.vendorChecks.map(vc => vc.checkedPrice);
    const peerAvg = peerPrices.length > 0 
        ? peerPrices.reduce((a, b) => a + b, 0) / peerPrices.length 
        : baseline; // Fallback to baseline if no peer reports

    return NextResponse.json({
        baseline: Math.round(baseline),
        peerAverage: Math.round(peerAvg),
        peerReportsCount: peerPrices.length
    });
  } catch (error) {
    console.error("Failed to fetch peer analytics:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

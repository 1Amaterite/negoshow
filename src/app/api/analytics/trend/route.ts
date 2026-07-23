import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const commodityIdStr = searchParams.get('commodityId');
    const daysStr = searchParams.get('days') || '30';
    
    const days = parseInt(daysStr, 10);
    
    if (!commodityIdStr) {
      return NextResponse.json({ error: "Missing commodityId" }, { status: 400 });
    }

    const commodityId = parseInt(commodityIdStr, 10);
    if (isNaN(commodityId)) {
       // if they pass a string ID, try to look it up. Our frontend previously used "red-onion".
       // we should handle fetching the ID.
       const c = await prisma.commodity.findFirst({
         where: { name: { contains: commodityIdStr.replace('-', ' '), mode: 'insensitive' } }
       });
       if (!c) return NextResponse.json({ error: "Commodity not found" }, { status: 404 });
       // for simplicity, let's just use c.id
       var cid = c.id;
    } else {
       var cid = commodityId;
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const prices = await prisma.retailPrice.findMany({
      where: {
        commodityId: cid,
        observedDate: {
          gte: cutoffDate
        }
      },
      orderBy: { observedDate: 'asc' }
    });

    let data = prices.map(p => ({
      araw: p.observedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      aktwal: Math.round(p.price),
      hula: null as number | null,
      isPeak: false
    }));

    if (data.length > 0) {
      const lastPrice = data[data.length - 1].aktwal;
      const lastDate = prices[prices.length - 1].observedDate;
      // Connect actual to hula
      data[data.length - 1].hula = lastPrice;
      
      for (let i = 1; i <= 2; i++) {
        const nextDate = new Date(lastDate);
        nextDate.setDate(nextDate.getDate() + (i * 3));
        data.push({
          araw: nextDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          aktwal: null as any,
          hula: Math.round(lastPrice * (1 + (i * 0.05))),
          isPeak: i === 2
        });
      }
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch trend data:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

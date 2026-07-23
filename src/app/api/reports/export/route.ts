import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const retailPrices = await prisma.retailPrice.findMany({
      where: { observedDate: { gte: thirtyDaysAgo } },
      include: { commodity: true, market: true },
      orderBy: { observedDate: 'desc' }
    });

    const vendorChecks = await prisma.vendorCheck.findMany({
      where: { checkedAt: { gte: thirtyDaysAgo } },
      include: { commodity: true, market: true },
      orderBy: { checkedAt: 'desc' }
    });

    let csvContent = "Type,Date,Commodity,Market,Price(PHP)\n";

    retailPrices.forEach(rp => {
        csvContent += `Baseline,${rp.observedDate.toISOString()},${rp.commodity.name},${rp.market.name},${rp.price}\n`;
    });

    vendorChecks.forEach(vc => {
        csvContent += `Community Report,${vc.checkedAt.toISOString()},${vc.commodity.name},${vc.market?.name || 'Unknown'},${vc.checkedPrice}\n`;
    });

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="negoshow_lgu_report.csv"'
      }
    });

  } catch (error) {
    console.error("Failed to generate report export:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

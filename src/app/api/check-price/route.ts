import { NextRequest, NextResponse } from 'next/server';
import { getLatestBaseline, saveVendorQuote } from '@/services/priceService';
import prisma from '@/services/dbService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { commodityId, quotedPrice, location } = body; // assuming location is the marketId

    if (!commodityId || quotedPrice === undefined || !location) {
      return NextResponse.json(
        { error: 'Missing required fields: commodityId, quotedPrice, and location (marketId) are required.' }, 
        { status: 400 }
      );
    }

    let marketId = typeof location === 'number' ? location : parseInt(location, 10);
    if (isNaN(marketId)) {
      const market = await prisma.market.findFirst({
        where: { name: { contains: String(location) } }
      });
      marketId = market ? market.id : 1;
    }

    // Save the vendor quote. Our service logic already records it in the database.
    const vendorQuote = await saveVendorQuote(Number(commodityId), marketId, Number(quotedPrice));

    // Fetch the baseline to calculate the variance precisely for the response
    const baseline = await getLatestBaseline(Number(commodityId), marketId);

    if (!baseline) {
      return NextResponse.json({
        status: 'UNKNOWN',
        variancePercentage: 0,
        recommendation: 'No baseline price available for this commodity at this location.',
        vendorQuote,
      });
    }

    const baselinePrice = baseline.price;
    const variance = quotedPrice - baselinePrice;
    const variancePercentage = (variance / baselinePrice) * 100;

    let status = 'FAIR';
    let recommendation = 'Price is within expected ranges.';

    // Decision Logic: Beyond ±10% from baseline is FLAGGED
    if (variancePercentage > 10) {
      status = 'FLAGGED';
      recommendation = 'Price is excessively high. Validating this record is recommended.';
    } else if (variancePercentage < -10) {
      status = 'FLAGGED';
      recommendation = 'Price is unusually low. Validating this record is recommended.';
    } else {
      recommendation = 'Price is within acceptable variance (±10%).';
    }

    return NextResponse.json({
      status,
      variancePercentage: Number(variancePercentage.toFixed(2)),
      recommendation,
      vendorQuote,
    });
  } catch (error) {
    console.error('Error in check-price API:', error);
    return NextResponse.json({ error: 'Failed to process price check' }, { status: 500 });
  }
}

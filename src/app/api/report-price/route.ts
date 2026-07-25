import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ipMap = new Map<string, number>();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { commodityId, marketId, price } = body;

    if (!commodityId || !marketId || !price) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // IP Rate Limiting
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const now = Date.now();
    if (ipMap.has(ip) && now - ipMap.get(ip)! < 10000) {
      return NextResponse.json({ error: "Too many requests. Please wait 10 seconds." }, { status: 429 });
    }
    ipMap.set(ip, now);

    // Anti-Spam Safeguard: Fetch the current baseline
    const latestBaseline = await prisma.retailPrice.findFirst({
      where: { commodityId, marketId, isVerified: true },
      orderBy: { observedDate: 'desc' }
    });

    if (latestBaseline) {
      // If the reported price is > 300% of the baseline, reject it
      const maxAllowedPrice = latestBaseline.price * 3.0;
      if (price > maxAllowedPrice) {
        return NextResponse.json(
          { error: "Price rejected by Anti-Spam Safeguard. The reported value is unrealistically high." },
          { status: 400 }
        );
      }
    }

    // Insert into VendorCheck table
    const check = await prisma.vendorCheck.create({
      data: {
        commodityId,
        marketId,
        checkedPrice: parseFloat(price),
        checkedAt: new Date(),
        isFlagged: false // Could flag it for admin review instead of rejecting, but rejection is requested
      }
    });

    return NextResponse.json({ success: true, id: check.id }, { status: 201 });
  } catch (error) {
    console.error("Failed to report price:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

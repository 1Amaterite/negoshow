import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { commodity, market, price } = await req.json();

    if (!commodity || !market || typeof price !== "number") {
      return NextResponse.json({ error: "Invalid input data" }, { status: 400 });
    }

    const dbCommodity = await prisma.commodity.upsert({
      where: { name: commodity },
      update: {},
      create: { name: commodity },
    });

    let dbMarket = await prisma.market.findFirst({
      where: { name: market },
    });

    if (!dbMarket) {
      dbMarket = await prisma.market.create({
        data: { name: market },
      });
    }

    const vendorCheck = await prisma.vendorCheck.create({
      data: {
        commodityId: dbCommodity.id,
        marketId: dbMarket.id,
        checkedPrice: price,
      },
    });

    return NextResponse.json({ success: true, data: vendorCheck });
  } catch (error) {
    console.error("Error creating price check:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}


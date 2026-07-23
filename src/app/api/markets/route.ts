import { NextResponse } from 'next/server';
import prisma from '@/services/dbService';

export async function GET() {
  try {
    const markets = await prisma.market.findMany({
      orderBy: { name: 'asc' }
    });
    return NextResponse.json(markets);
  } catch (error) {
    console.error("Failed to fetch markets:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { getTrendData } from '@/lib/services/analytics';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const commodityIdStr = searchParams.get('commodityId');
    const daysStr = searchParams.get('days') || '30';
    
    if (!commodityIdStr) {
      return NextResponse.json({ error: "Missing commodityId" }, { status: 400 });
    }

    const data = await getTrendData(commodityIdStr, daysStr);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Failed to fetch trend data:", error);
    if (error.message === "Commodity not found") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { getDescriptiveActivity } from '@/lib/services/analytics';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const daysStr = searchParams.get('days') || '7';

    const data = await getDescriptiveActivity(daysStr);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch activity analytics:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

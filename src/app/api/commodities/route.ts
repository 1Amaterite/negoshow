import { NextResponse } from 'next/server';
import { getCommodities } from '@/lib/services/analytics';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await getCommodities();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch commodities:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

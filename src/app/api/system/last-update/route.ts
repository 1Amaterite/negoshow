import { NextResponse } from 'next/server';
import { getLastUpdate } from '@/lib/services/analytics';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await getLastUpdate();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch last update:", error);
    return NextResponse.json({ lastUpdate: new Date().toISOString() });
  }
}

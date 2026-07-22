import { NextResponse } from 'next/server';
import { checkDataDrought } from '@/services/droughtService';

// This endpoint can be hit by a cron job (e.g., Vercel Cron) daily or hourly.
export async function GET() {
  try {
    const result = await checkDataDrought();
    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error('Error in check-drought cron:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

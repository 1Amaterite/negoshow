import { NextResponse } from 'next/server';
import prisma from '@/services/dbService';

export async function GET() {
  try {
    const latestBaselines = await prisma.retailPrice.findMany({
      where: { isVerified: true },
      orderBy: { observedDate: 'desc' },
      distinct: ['commodityId'],
      include: { commodity: true }
    });

    return NextResponse.json(latestBaselines);
  } catch (error) {
    console.error('Error fetching baselines:', error);
    return NextResponse.json({ error: 'Failed to fetch baselines' }, { status: 500 });
  }
}

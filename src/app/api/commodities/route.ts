import { NextResponse } from 'next/server';
import prisma from '@/services/dbService';

export async function GET() {
  try {
    const commodities = await prisma.commodity.findMany({
      orderBy: { id: 'asc' },
    });
    return NextResponse.json(commodities);
  } catch (error) {
    console.error('Error fetching commodities:', error);
    return NextResponse.json({ error: 'Failed to fetch commodities' }, { status: 500 });
  }
}

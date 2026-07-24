import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const latestBulletin = await prisma.bulletinRecord.findFirst({
      orderBy: { uploadDate: 'desc' }
    });
    
    if (latestBulletin) {
      return NextResponse.json({ lastUpdate: latestBulletin.uploadDate.toISOString() });
    }
    
    // Fallback if no bulletins yet
    const latestRetail = await prisma.retailPrice.findFirst({
      orderBy: { observedDate: 'desc' }
    });
    
    if (latestRetail) {
      return NextResponse.json({ lastUpdate: latestRetail.observedDate.toISOString() });
    }
    
    return NextResponse.json({ lastUpdate: new Date().toISOString() });
  } catch (error) {
    console.error("Failed to fetch last update:", error);
    return NextResponse.json({ lastUpdate: new Date().toISOString() });
  }
}

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const bulletins = await prisma.bulletinRecord.findMany({
      orderBy: { uploadDate: 'desc' },
      take: 20
    });

    const data = bulletins.map(b => ({
      id: b.id.toString(),
      type: b.fileUrl.endsWith('.pdf') ? "PDF" : "IMG",
      source: "DA Bantay Presyo", // or from metadata if we added it to schema
      date: b.uploadDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      location: "Metro Manila",
      commodities: ["Lahat ng Gulay"],
      verified: b.processedStatus === 'PROCESSED'
    }));

    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch bulletins:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

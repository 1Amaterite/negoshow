import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

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
      status: b.processedStatus
    }));

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Failed to fetch bulletins:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    const updated = await prisma.bulletinRecord.update({
      where: { id: parseInt(id) },
      data: { processedStatus: 'PROCESSED' }
    });
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Failed to publish bulletin:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    await prisma.bulletinRecord.delete({
      where: { id: parseInt(id) }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete bulletin:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

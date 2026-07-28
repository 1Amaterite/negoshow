import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { processBulletin } from '@/services/geminiService';

const prisma = new PrismaClient();

export const maxDuration = 60; // Allow up to 60 seconds for Gemini PDF parsing

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    const bulletin = await prisma.bulletinRecord.findUnique({ where: { id: parseInt(id) } });
    if (!bulletin) return NextResponse.json({ error: 'Bulletin not found' }, { status: 404 });

    // Mark it as processing again
    await prisma.bulletinRecord.update({
      where: { id: parseInt(id) },
      data: { processedStatus: 'PENDING' }
    });

    try {
      await processBulletin(bulletin.id, bulletin.fileUrl);
    } catch (processError) {
      console.error('Gemini processing retry failed:', processError);
      
      await prisma.bulletinRecord.update({
        where: { id: bulletin.id },
        data: { processedStatus: 'REQUIRES_MANUAL_REVIEW' }
      });
      
      return NextResponse.json({ 
        message: 'Retry failed. Requires manual review.', 
      }, { status: 202 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to retry bulletin:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

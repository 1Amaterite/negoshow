import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    const alert = await prisma.adminAlert.findFirst({
      where: {
        message: {
          contains: `Bulletin ID ${id}`
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (alert) {
      return NextResponse.json({ errorReason: alert.message });
    }

    return NextResponse.json({ errorReason: 'Unknown error or alert was purged.' });
  } catch (error) {
    console.error("Failed to fetch bulletin error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

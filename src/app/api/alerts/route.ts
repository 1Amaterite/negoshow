import { NextResponse } from 'next/server';
import { prisma } from '@/services/dbService';

export async function GET() {
  try {
    const alerts = await prisma.adminAlert.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    return NextResponse.json({ data: alerts });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { id } = await req.json();
    await prisma.adminAlert.update({
      where: { id },
      data: { isRead: true }
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

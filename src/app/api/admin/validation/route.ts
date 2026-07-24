import { NextResponse } from 'next/server';
import { prisma } from '@/services/dbService';

export async function GET(request: Request) {
  try {
    const pendingPrices = await prisma.retailPrice.findMany({
      where: { isVerified: false },
      include: {
        commodity: true,
        market: true,
        sourceBulletin: true
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json({ data: pendingPrices });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!process.env.ADMIN_API_TOKEN || authHeader !== `Bearer ${process.env.ADMIN_API_TOKEN}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, action } = await request.json(); // action can be 'approve' or 'reject'
    
    if (action === 'approve') {
      const updated = await prisma.retailPrice.update({
        where: { id },
        data: { isVerified: true }
      });
      return NextResponse.json({ success: true, data: updated });
    } else if (action === 'reject') {
      await prisma.retailPrice.delete({
        where: { id }
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

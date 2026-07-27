import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/services/dbService';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pendingPrices = await prisma.vendorCheck.findMany({
      where: { validationStatus: 'pending' },
      include: {
        commodity: true,
        market: true
      },
      orderBy: { checkedAt: 'desc' }
    });

    const logPrices = await prisma.vendorCheck.findMany({
      where: { validationStatus: { not: 'pending' } },
      include: {
        commodity: true,
        market: true
      },
      orderBy: { checkedAt: 'desc' },
      take: 100
    });

    return NextResponse.json({ data: pendingPrices, logs: logPrices });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, action } = await request.json(); // action can be 'approve' or 'reject'
    
    let updatedRecord;
    if (action === 'approve' || action === 'approved') {
      updatedRecord = await prisma.vendorCheck.update({
        where: { id },
        data: { isVerified: true, validationStatus: 'approved' }
      });
    } else if (action === 'reject' || action === 'rejected') {
      updatedRecord = await prisma.vendorCheck.update({
        where: { id },
        data: { isVerified: false, validationStatus: 'rejected' }
      });
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: updatedRecord });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

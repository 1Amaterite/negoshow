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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const search = searchParams.get('search') || '';
    const statusFilter = searchParams.get('status') || 'all';

    const skip = (page - 1) * limit;

    const pendingPrices = await prisma.vendorCheck.findMany({
      where: { validationStatus: 'pending' },
      include: {
        commodity: true,
        market: true
      },
      orderBy: { checkedAt: 'desc' }
    });

    const logsWhere: any = { validationStatus: { not: 'pending' } };

    if (statusFilter !== 'all') {
      logsWhere.validationStatus = statusFilter;
    }

    if (search) {
      logsWhere.OR = [
        { commodity: { name: { contains: search, mode: 'insensitive' } } },
        { market: { name: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const [logPrices, totalLogs] = await Promise.all([
      prisma.vendorCheck.findMany({
        where: logsWhere,
        include: {
          commodity: true,
          market: true
        },
        orderBy: { checkedAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.vendorCheck.count({ where: logsWhere })
    ]);

    return NextResponse.json({ 
      data: pendingPrices, 
      logs: logPrices,
      pagination: {
        total: totalLogs,
        page,
        limit,
        totalPages: Math.ceil(totalLogs / limit)
      }
    });
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

    const { id, action } = await request.json();
    
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
    } else if (action === 'undo') {
      updatedRecord = await prisma.vendorCheck.update({
        where: { id },
        data: { isVerified: false, validationStatus: 'pending' }
      });
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: updatedRecord });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

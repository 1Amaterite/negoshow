import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json({ success: false, error: 'Username and password are required' }, { status: 400 });
    }

    // Secure database lookup
    const user = await prisma.adminUser.findUnique({
      where: { username }
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'Invalid username or password' }, { status: 401 });
    }

    // In a real production app, use bcrypt.compare(password, user.password)
    // For this demonstration project per user request, we match the string directly or handle hashing
    if (user.password !== password) {
      return NextResponse.json({ success: false, error: 'Invalid username or password' }, { status: 401 });
    }

    // Success - in a real app, you would set an HTTP-only cookie with a JWT here
    return NextResponse.json({ success: true, message: 'Logged in successfully' });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

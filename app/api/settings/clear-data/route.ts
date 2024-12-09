
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

export async function POST() {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Delete all expenses and incomes for the user
    await prisma.$transaction([
      prisma.expense.deleteMany({
        where: { userId: user.id },
      }),
      prisma.income.deleteMany({
        where: { userId: user.id },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Clear data error:', error);
    return NextResponse.json(
      { error: 'Failed to clear data' },
      { status: 500 }
    );
  }
}
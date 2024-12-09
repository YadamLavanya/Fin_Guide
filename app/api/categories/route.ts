import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const categories = await prisma.category.findMany({
    where: {
      user: { email: session.user.email }
    }
  });

  return NextResponse.json(categories);
}

export async function POST(req: Request) {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const data = await req.json();
  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  });

  const category = await prisma.category.create({
    data: {
      name: data.name,
      userId: user!.id,
      typeId: data.typeId || 'default',
      isDefault: false
    }
  });

  return NextResponse.json(category);
}
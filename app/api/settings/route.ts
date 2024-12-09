import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      preferences: {
        include: {
          currency: true,
        }
      },
      notifications: true,
    }
  });

  return NextResponse.json({
    currency: user?.preferences?.currency?.code || 'USD',
    notifications: {
      email: user?.notifications.some(n => n.type === 'EMAIL' && n.enabled) || false
    }
  });
}

export async function PUT(req: Request) {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const data = await req.json();
  
  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { 
        preferences: true,
        notifications: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Ensure currency exists
    const currency = await prisma.currency.findUnique({
      where: { code: data.currency }
    });

    if (!currency) {
      return NextResponse.json({ error: 'Invalid currency' }, { status: 400 });
    }

    // Create or update preferences
    if (!user.preferences) {
      await prisma.userPreference.create({
        data: {
          userId: user.id,
          currencyId: currency.id,
          // Set default values for required fields
          languageId: (await prisma.language.findFirst())!.id,
          themeId: (await prisma.theme.findFirst())!.id,
        }
      });
    } else {
      await prisma.userPreference.update({
        where: { userId: user.id },
        data: {
          currencyId: currency.id,
        }
      });
    }

    // Update notifications
    await prisma.notificationSetting.upsert({
      where: {
        userId_type: {
          userId: user.id,
          type: 'EMAIL'
        }
      },
      create: {
        userId: user.id,
        type: 'EMAIL',
        enabled: data.notifications.email
      },
      update: {
        enabled: data.notifications.email
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Settings update error:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}

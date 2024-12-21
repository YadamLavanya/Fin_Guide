import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUniqueOrThrow({
      where: { email: session.user.email },
      include: {
        preferences: {
          select: {
            monthlyBudget: true,
            currency: {
              select: {
                code: true
              }
            },
            language: {
              select: {
                code: true
              }
            },
            theme: {
              select: {
                name: true
              }
            }
          }
        },
        notifications: {
          select: {
            type: true,
            enabled: true
          }
        }
      }
    });

    return NextResponse.json({
      preferences: {
        currency: user.preferences?.currency?.code || 'USD',
        language: user.preferences?.language?.code || 'en',
        theme: user.preferences?.theme?.name || 'light',
        monthlyBudget: user.preferences?.monthlyBudget || 0,
      },
      notifications: {
        email: user.notifications.some(n => n.type === 'EMAIL' && n.enabled) || false,
        push: user.notifications.some(n => n.type === 'PUSH' && n.enabled) || false,
        sms: user.notifications.some(n => n.type === 'SMS' && n.enabled) || false,
      }
    });
  } catch (error) {
    console.error('Settings fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();

    // Validate data
    if (!data.preferences || typeof data.preferences !== 'object') {
      return NextResponse.json({ error: 'Invalid preferences data' }, { status: 400 });
    }
    
    const user = await prisma.user.findUniqueOrThrow({
      where: { email: session.user.email }
    });

    // Get required references with error handling
    const [currency, language, theme] = await Promise.all([
      prisma.currency.findUnique({ 
        where: { code: data.preferences.currency || 'USD' }
      }),
      prisma.language.findUnique({ 
        where: { code: data.preferences.language || 'en' }
      }),
      prisma.theme.findUnique({ 
        where: { name: data.preferences.theme || 'light' }
      })
    ]);

    if (!currency || !language || !theme) {
      return NextResponse.json({ 
        error: 'One or more preferences are invalid' 
      }, { status: 400 });
    }

    // Update or create preferences
    await prisma.userPreference.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        currencyId: currency.id,
        languageId: language.id,
        themeId: theme.id,
        monthlyBudget: data.preferences.monthlyBudget || 0,
      },
      update: {
        currencyId: currency.id,
        languageId: language.id,
        themeId: theme.id,
        monthlyBudget: data.preferences.monthlyBudget || 0,
      }
    });

    // Update notifications if provided
    if (data.notifications) {
      await Promise.all(
        Object.entries(data.notifications).map(([type, enabled]) =>
          prisma.notificationSetting.upsert({
            where: {
              userId_type: {
                userId: user.id,
                type: type.toUpperCase() as 'EMAIL' | 'PUSH' | 'SMS'
              }
            },
            create: {
              userId: user.id,
              type: type.toUpperCase() as 'EMAIL' | 'PUSH' | 'SMS',
              enabled: !!enabled
            },
            update: {
              enabled: !!enabled
            }
          })
        )
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Settings update error:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}

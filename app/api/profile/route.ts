import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { 
        id: session.user.id,
        isDeleted: false 
      },
      include: {
        contactInfo: {
          select: {
            phone: true,
            avatarUrl: true
          }
        },
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
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Fetch aggregate statistics
    const [expenseStats, categoryCount] = await Promise.all([
      prisma.expense.aggregate({
        where: {
          userId: session.user.id,
          isVoid: false,
        },
        _sum: { amount: true },
      }),
      prisma.category.count({
        where: {
          userId: session.user.id,
          isSystem: false,
        },
      }),
    ]);

    // Construct safe profile response
    const profile = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      contact: user.contactInfo ? {
        phone: user.contactInfo.phone,
        avatarUrl: user.contactInfo.avatarUrl,
      } : null,
      preferences: {
        currency: user.preferences?.currency.code,
        language: user.preferences?.language.code,
        theme: user.preferences?.theme.name,
        monthlyBudget: user.preferences?.monthlyBudget,
      },
      stats: {
        totalExpenses: expenseStats._sum.amount || 0,
        categoryCount: categoryCount,
      },
      createdAt: user.createdAt,
    };

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to load profile' }, 
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await req.json();
    
    if (!data.firstName) {
      return NextResponse.json({ error: 'First name is required' }, { status: 400 });
    }
    
    const result = await prisma.$transaction(async (tx) => {
      // Update basic user info
      const user = await tx.user.update({
        where: { id: session.user.id },
        data: { 
          firstName: data.firstName,
          lastName: data.lastName || null,
        }
      });
      
      // Update contact info if provided
      if (data.contact) {
        await tx.userContact.upsert({
          where: { userId: user.id },
          create: {
            userId: user.id,
            firstName: data.firstName,
            lastName: data.lastName || null,
            phone: data.contact.phone || null,
            avatarUrl: data.contact.avatarUrl || null,
          },
          update: {
            phone: data.contact.phone || null,
            avatarUrl: data.contact.avatarUrl || null,
          },
        });
      }

      // Update monthlyBudget if provided
      if (typeof data.preferences?.monthlyBudget === 'number') {
        await tx.userPreference.update({
          where: { userId: user.id },
          data: { 
            monthlyBudget: data.preferences.monthlyBudget,
          },
        });
      }

      return user;
    });

    return NextResponse.json({ success: true, userId: result.id });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
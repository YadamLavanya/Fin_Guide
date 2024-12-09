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
    // First, get the user with basic relations
    const user = await prisma.user.findUnique({
      where: { 
        id: session.user.id,
        isDeleted: false 
      },
      include: {
        contactInfo: true,
        preferences: {
          include: {
            currency: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Separately calculate stats to avoid JOIN complexity
    const stats = await prisma.$transaction([
      prisma.expense.aggregate({
        where: {
          userId: session.user.id,
          isVoid: false,
        },
        _sum: {
          amount: true,
        },
      }),
      prisma.category.count({
        where: {
          userId: session.user.id,
          isSystem: false,
        },
      }),
    ]);

    // Construct the safe profile response
    const safeProfile = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      createdAt: user.createdAt,
      contactInfo: user.contactInfo ? {
        phone: user.contactInfo.phone,
        avatarUrl: user.contactInfo.avatarUrl,
      } : undefined,
      preferences: user.preferences ? {
        monthlyBudget: user.preferences.monthlyBudget,
        currency: user.preferences.currency,
      } : undefined,
      stats: {
        totalExpenses: stats[0]._sum.amount || 0,
        categoriesCount: stats[1] || 0,
      },
    };

    return NextResponse.json(safeProfile);
  } catch (error) {
    console.error('Error fetching profile:', error);
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

  const { 
    firstName, 
    lastName, 
    contactInfo,
    preferences,
  } = await req.json();

  try {
    const transaction = await prisma.$transaction([
      // Update user without email
      prisma.user.update({
        where: { id: session.user.id },
        data: { 
          firstName,
          lastName,
        }
      }),
      
      // Update contact info
      prisma.userContact.upsert({
        where: { userId: session.user.id },
        create: {
          userId: session.user.id,
          firstName,
          lastName,
          phone: contactInfo.phone,
          avatarUrl: contactInfo.avatarUrl,
        },
        update: {
          phone: contactInfo.phone,
          avatarUrl: contactInfo.avatarUrl,
        },
      }),

      // Update preferences
      prisma.userPreference.update({
        where: { userId: session.user.id },
        data: { 
          monthlyBudget: preferences.monthlyBudget,
        },
      }),
    ]);

    const updatedProfile = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        contactInfo: true,
        preferences: {
          include: {
            currency: true
          }
        },
        notifications: true,
      },
    });

    // Fetch updated stats
    const stats = await prisma.expense.aggregate({
      where: {
        userId: session.user.id,
        isVoid: false,
      },
      _sum: {
        amount: true,
      },
      _count: {
        categoryId: true,
      },
    });

    return NextResponse.json({
      ...updatedProfile,
      stats: {
        totalExpenses: stats._sum.amount || 0,
        categoriesCount: stats._count.categoryId || 0,
      }
    });
  } catch (error) {
    console.error('Transaction failed:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
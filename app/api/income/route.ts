import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PaymentMethodEnum } from '@prisma/client';
import { calculateNextProcessDate } from '@/utils/dates';
import { prisma } from '@/lib/prisma';

const defaultCategories = [
  { name: 'Salary', icon: '💼' },
  { name: 'Investment', icon: '📈' },
  { name: 'Freelance', icon: '💻' },
  { name: 'Rental', icon: '🏠' },
  { name: 'Gift', icon: '🎁' },
  { name: 'Other', icon: '📝' },
];

async function ensureUserCategories(userId: string) {
  // Get or create default income type
  const incomeType = await prisma.categoryType.upsert({
    where: { name: 'Income' },
    update: {},
    create: { name: 'Income', icon: '💰' },
  });

  // Create default categories for user if they don't exist
  for (const category of defaultCategories) {
    await prisma.category.upsert({
      where: {
        userId_name: {
          userId: userId,
          name: category.name,
        },
      },
      update: {},
      create: {
        name: category.name,
        icon: category.icon,
        typeId: incomeType.id,
        userId: userId,
        isSystem: true,
        isDefault: category.name === 'Other',
      },
    });
  }
}

// Add these validation functions at the top
const sanitizeString = (str: string): string => {
  return str.replace(/[<>]/g, '').trim();
};

const validateAmount = (amount: number): boolean => {
  return !isNaN(amount) && amount > 0 && amount <= 999999999.99;
};

const validateDescription = (desc: string): boolean => {
  return /^[a-zA-Z0-9\s\-_.,!?()]{1,255}$/.test(desc);
};

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const incomes = await prisma.income.findMany({
      where: {
        user: { email: session.user.email },
        ...(category && { categoryId: category }),
        ...(startDate && endDate && {
          date: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        }),
        isVoid: false,
      },
      include: {
        category: {
          select: { name: true, icon: true },
        },
        paymentMethod: {
          select: { name: true },
        },
        recurring: {
          select: {
            id: true,
            pattern: {
              select: {
                type: true,
                frequency: true
              }
            },
            startDate: true,
            endDate: true,
            nextProcessDate: true
          }
        },
      },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json(incomes);
  } catch (error) {
    console.error('GET income error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const data = await request.json().catch(() => null);
    if (!data) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    // Validate and sanitize inputs
    const description = sanitizeString(data.description);
    const amount = parseFloat(data.amount);

    if (!validateDescription(description)) {
      return NextResponse.json({ error: 'Invalid description format' }, { status: 400 });
    }

    if (!validateAmount(amount)) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    // Validate payment method
    const paymentMethodName = data.paymentMethod.replace('_', '_') as PaymentMethodEnum;
    if (!Object.values(PaymentMethodEnum).includes(paymentMethodName)) {
      return NextResponse.json({ 
        error: `Invalid payment method. Must be one of: ${Object.values(PaymentMethodEnum).join(', ')}` 
      }, { status: 400 });
    }

    const [user, paymentMethod] = await Promise.all([
      prisma.user.findUnique({
        where: { email: session.user.email },
      }),
      prisma.paymentMethod.findUnique({
        where: { name: paymentMethodName },
      }),
    ]);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!paymentMethod) {
      return NextResponse.json({ 
        error: `Payment method '${paymentMethodName}' not found in database` 
      }, { status: 400 });
    }

    await ensureUserCategories(user.id);

    const userWithCategories = await prisma.user.findUnique({
      where: { id: user.id },
      include: { categories: true },
    });

    const category = userWithCategories?.categories.find(cat => cat.name === data.category);

    if (!category) {
      return NextResponse.json(
        { error: `Category '${data.category}' not found` },
        { status: 404 }
      );
    }

    // Create income data object with all necessary fields
    const incomeData = {
      userId: user.id,
      date: new Date(data.date),
      description,
      amount,
      categoryId: category.id,
      paymentMethodId: paymentMethod.id,
      notes: data.notes || '',
      ...(data.recurring && {
        recurring: {
          create: {
            pattern: {
              create: {
                type: data.recurring.pattern.type,
                frequency: data.recurring.pattern.frequency,
                dayOfWeek: data.recurring.pattern.type === 'WEEKLY' ? new Date(data.date).getDay() : null,
                dayOfMonth: ['MONTHLY', 'YEARLY'].includes(data.recurring.pattern.type) ? new Date(data.date).getDate() : null,
                monthOfYear: data.recurring.pattern.type === 'YEARLY' ? new Date(data.date).getMonth() + 1 : null,
              }
            },
            startDate: new Date(data.date),
            endDate: data.recurring.endDate ? new Date(data.recurring.endDate) : null,
            lastProcessed: new Date(),
            nextProcessDate: calculateNextProcessDate(
              new Date(data.date),
              data.recurring.pattern.type,
              data.recurring.pattern.frequency,
              ['MONTHLY', 'YEARLY'].includes(data.recurring.pattern.type) ? new Date(data.date).getDate() : null,
              data.recurring.pattern.type === 'WEEKLY' ? new Date(data.date).getDay() : null,
              data.recurring.pattern.type === 'YEARLY' ? new Date(data.date).getMonth() + 1 : null,
            ),
          },
        },
      }),
    };

    const income = await prisma.income.create({
      data: incomeData,
      include: {
        category: true,
        paymentMethod: true,
        recurring: {
          include: {
            pattern: true,
          },
        },
      },
    });

    return NextResponse.json(income, { status: 201 });

  } catch (error) {
    console.error('POST income error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await request.json();

    const income = await prisma.income.update({
      where: { id: data.id },
      data: {
        description: data.description,
        amount: parseFloat(data.amount),
        categoryId: data.categoryId,
        paymentMethodId: data.paymentMethodId,
        date: new Date(data.date),
        notes: data.notes,
      },
      include: {
        category: {
          select: { name: true, icon: true },
        },
        paymentMethod: {
          select: { name: true },
        },
        recurring: {
          select: {
            id: true,
            pattern: {
              select: {
                type: true,
                frequency: true
              }
            },
            startDate: true,
            endDate: true,
            nextProcessDate: true
          }
        },
      },
    });

    return NextResponse.json(income);
  } catch (error) {
    console.error('Income update error:', error);
    return NextResponse.json(
      { error: 'Failed to update income' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
  }

  try {
    const income = await prisma.income.update({
      where: { id },
      data: { isVoid: true },
    });

    return NextResponse.json(income);
  } catch (error) {
    console.error('Income deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete income' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PaymentMethodEnum } from '@prisma/client';
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

export async function GET(req: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
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
          include: {
            pattern: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    return new NextResponse(JSON.stringify(incomes), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('GET income error:', error);
    return new NextResponse(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await req.json().catch(() => null);
    if (!data) {
      return new NextResponse(JSON.stringify({ error: 'Invalid request body' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
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

    // Update the income data with sanitized values
    const incomeData = {
      ...data,
      description,
      amount,
    };

    // Validate payment method
    const paymentMethodName = data.paymentMethod.replace('_', '_') as PaymentMethodEnum;
    if (!Object.values(PaymentMethodEnum).includes(paymentMethodName)) {
      return new NextResponse(JSON.stringify({ 
        error: `Invalid payment method. Must be one of: ${Object.values(PaymentMethodEnum).join(', ')}` 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
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

    let incomeData: any = {
      userId: user.id,
      date: new Date(data.date),
      description: data.description,
      amount: parseFloat(data.amount),
      categoryId: category.id,
      paymentMethodId: paymentMethod.id,
      notes: data.notes || '',
    };

    // Handle recurring income if specified
    if (data.recurring) {
      const pattern = await prisma.recurringPattern.create({
        data: {
          type: data.recurring.pattern.type,
          frequency: data.recurring.pattern.frequency,
        },
      });

      incomeData.recurring = {
        create: {
          patternId: pattern.id,
          startDate: new Date(data.recurring.startDate),
          endDate: data.recurring.endDate ? new Date(data.recurring.endDate) : null,
          lastProcessed: new Date(),
          nextProcessDate: new Date(data.date), // Calculate next process date based on pattern
        },
      };
    }

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

    return new NextResponse(JSON.stringify(income), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('POST income error:', error);
    return new NextResponse(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function PUT(req: Request) {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const data = await req.json();

  try {
    const income = await prisma.income.update({
      where: { id: data.id },
      data: {
        description: data.description,
        amount: parseFloat(data.amount),
        categoryId: data.categoryId,
        paymentMethodId: data.paymentMethodId,
        date: new Date(data.date),
        notes: data.notes,
        originalAmount: data.originalAmount,
      },
    });

    return NextResponse.json(income);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update income' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
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
    return NextResponse.json(
      { error: 'Failed to delete income' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import {PaymentMethodEnum} from '@prisma/client';
import { sendBudgetAlert } from '@/utils/email';

import { prisma } from '@/lib/prisma';

const defaultCategories = [
  { name: 'Food', icon: '🛒' },
  { name: 'Housing', icon: '🏠' },
  { name: 'Bills', icon: '📄' },
  { name: 'Transport', icon: '🚗' },
  { name: 'Entertainment', icon: '☕' },
  { name: 'Shopping', icon: '🎁' },
  { name: 'Other', icon: '📱' },
];

async function ensureUserCategories(userId: string) {
  // Get or create default expense type
  const expenseType = await prisma.categoryType.upsert({
    where: { name: 'Expense' },
    update: {},
    create: { name: 'Expense', icon: '💰' },
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
        typeId: expenseType.id,
        userId: userId,
        isSystem: true,
        isDefault: category.name === 'Other',
      },
    });
  }
}

export async function GET(req: Request) {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  try {
    const expenses = await prisma.expense.findMany({
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
    
    return NextResponse.json(expenses);

    
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 });
  }
}

// Add validation functions
const sanitizeString = (str: string): string => {
  return str.replace(/[<>]/g, '').trim();
};

const validateAmount = (amount: number): boolean => {
  return !isNaN(amount) && amount > 0 && amount <= 999999999.99;
};

const validateDescription = (desc: string): boolean => {
  return /^[a-zA-Z0-9\s\-_.,!?()]{1,255}$/.test(desc);
};

export async function POST(req: Request) {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const data = await req.json();

  try {
    // Validate and sanitize inputs
    const description = sanitizeString(data.description);
    const amount = parseFloat(data.amount);

    if (!validateDescription(description)) {
      return NextResponse.json({ error: 'Invalid description format' }, { status: 400 });
    }

    if (!validateAmount(amount)) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    // Get user first
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Ensure user has default categories
    await ensureUserCategories(user.id);

    // Get user with categories after ensuring they exist
    const userWithCategories = await prisma.user.findUnique({
      where: { id: user.id },
      include: { categories: true },
    });

    // Find category by name for this user
    const category = userWithCategories?.categories.find(cat => cat.name === data.category);

    if (!category) {
      return NextResponse.json(
        { error: `Category '${data.category}' not found` },
        { status: 404 }
      );
    }

    // Find payment method
    const paymentMethod = await prisma.paymentMethod.findUnique({
      where: { name: data.paymentMethod as PaymentMethodEnum },
    });

    if (!paymentMethod) {
      return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 });
    }

    // Create expense data object
    const expenseData = {
      userId: user.id,
      date: new Date(data.date),
      description,
      amount,
      categoryId: category.id,
      paymentMethodId: paymentMethod.id,
      notes: data.notes || '',
      ...(data.recurring && data.recurring.pattern && {
        recurring: {
          create: {
            pattern: {
              create: {
                type: data.recurring.pattern.type,
                frequency: data.recurring.pattern.frequency
              }
            },
            startDate: new Date(data.recurring.startDate),
            endDate: data.recurring.endDate ? new Date(data.recurring.endDate) : null,
            lastProcessed: new Date(data.recurring.startDate),
            nextProcessDate: new Date(data.recurring.startDate),
          }
        }
      })
    };

    const expense = await prisma.expense.create({
      data: expenseData,
      include: {
        category: true,
        paymentMethod: true,
        recurring: {
          include: {
            pattern: true
          }
        }
      },
    });

    // Check budget after creating expense
    const userPreferences = await prisma.userPreference.findUnique({
      where: { userId: user.id },
    });

    if (userPreferences?.monthlyBudget) {
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      const monthlyTotal = await prisma.expense.aggregate({
        where: {
          userId: user.id,
          isVoid: false,
          date: {
            gte: new Date(currentYear, currentMonth, 1),
            lt: new Date(currentYear, currentMonth + 1, 1),
          },
        },
        _sum: {
          amount: true,
        },
      });

      const totalSpent = monthlyTotal._sum.amount || 0;

      if (totalSpent > userPreferences.monthlyBudget && session.user.email) {
        // The sendBudgetAlert function will now check notification settings internally
        await sendBudgetAlert(
          session.user.email,
          totalSpent,
          userPreferences.monthlyBudget
        );
      }
    }

    return NextResponse.json(expense);

  } catch (error) {
    console.error('Expense creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create expense' },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const data = await req.json();
  const expense = await prisma.expense.update({
    where: { id: data.id },
    data: {
      description: data.description,
      amount: data.amount,
      categoryId: data.categoryId,
      paymentMethodId: data.paymentMethodId,
      notes: data.notes,
      originalAmount: data.originalAmount,
    },
  });

  return NextResponse.json(expense);
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

  const expense = await prisma.expense.update({
    where: { id },
    data: { isVoid: true },
  });

  return NextResponse.json(expense);
}

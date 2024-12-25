import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PaymentMethodEnum, Prisma } from '@prisma/client';
import { sendBudgetAlert } from '@/utils/email';
import { calculateNextProcessDate } from '@/utils/dates';
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

export async function GET(request: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
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
    return NextResponse.json(
      { error: 'Failed to fetch expenses' },
      { status: 500 }
    );
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

// Add utility function for Prisma error messages
const getPrismaErrorMessage = (errorCode: string): string => {
  const errorMessages: Record<string, string> = {
    P2002: 'A unique constraint would be violated.',
    P2014: 'The change you are trying to make would violate data integrity.',
    P2003: 'Foreign key constraint failed.',
    DEFAULT: 'An unknown database error occurred.'
  };
  return errorMessages[errorCode] || errorMessages.DEFAULT;
};

export async function POST(request: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await request.json();

    // Pre-validate data before starting transaction
    const description = sanitizeString(data.description);
    const amount = parseFloat(data.amount);

    if (!validateDescription(description)) {
      return NextResponse.json({ error: 'Invalid description format' }, { status: 400 });
    }

    if (!validateAmount(amount)) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    // First get user and ensure categories exist outside transaction
    const user = await prisma.user.findUniqueOrThrow({
      where: { email: session.user.email },
      include: {
        categories: true,
      }
    });

    await ensureUserCategories(user.id);

    // Find category and payment method before transaction
    const category = user.categories.find(cat => cat.name === data.category);
    if (!category) {
      return NextResponse.json(
        { error: `Category '${data.category}' not found` },
        { status: 404 }
      );
    }

    const paymentMethod = await prisma.paymentMethod.findUnique({
      where: { name: data.paymentMethod as PaymentMethodEnum },
    });

    if (!paymentMethod) {
      return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 });
    }

    // Now execute the transaction with increased timeout
    const result = await prisma.$transaction(async (tx) => {
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
            }
          }
        })
      };

      const expense = await tx.expense.create({
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

      // Check budget limits
      const userPreferences = await tx.userPreference.findUnique({
        where: { userId: user.id },
        select: { monthlyBudget: true }
      });

      if (userPreferences?.monthlyBudget) {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        const monthlyTotal = await tx.expense.aggregate({
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
          // Move budget alert outside transaction
          setTimeout(() => {
            sendBudgetAlert(
              session.user.email!,
              totalSpent,
              userPreferences.monthlyBudget!
            ).catch(console.error);
          }, 0);
        }
      }

      return expense;
    }, {
      timeout: 10000 // Increase timeout to 10 seconds
    });

    return NextResponse.json(result, { status: 201 });

  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      const errorMessage = getPrismaErrorMessage(error.code);
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }
    console.error('Expense creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create expense' },
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

    const expense = await prisma.expense.update({
      where: { id: data.id },
      data: {
        description: data.description,
        amount: parseFloat(data.amount),
        categoryId: data.categoryId,
        paymentMethodId: data.paymentMethodId,
        date: new Date(data.date),
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

    return NextResponse.json(expense);
  } catch (error) {
    console.error('Expense update error:', error);
    return NextResponse.json(
      { error: 'Failed to update expense' },
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
    const expense = await prisma.expense.update({
      where: { id },
      data: { isVoid: true },
    });

    return NextResponse.json(expense);
  } catch (error) {
    console.error('Expense deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete expense' },
      { status: 500 }
    );
  }
}

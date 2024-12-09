import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { DashboardData } from '@/types/dashboard';

interface CategoryDistribution {
  categoryId: string;
  total: number;
}

interface MonthlyTrend {
  date: Date;
  _sum: {
    amount: number | null;
  };
}

interface TrendAccumulator {
  month: string;
  amount: number;
}

interface ExpenseRecord {
  id: string;
  description: string | null;
  amount: number;
  date: Date;
  category: { name: string };
  paymentMethod: { name: string };
  type: 'expense';
}

interface IncomeRecord {
  id: string;
  description: string | null;
  amount: number;
  date: Date;
  category: { name: string };
  paymentMethod: { name: string };
  type: 'income';
}

export async function GET(): Promise<NextResponse<DashboardData | { error: string }>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        preferences: {
          include: { currency: true }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get the current date and calculate date ranges
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);

    const [
      currentMonthStats,
      lastMonthStats,
      monthlyStats,
      categoryDistribution,
      recentTransactions,
      monthlyTrends
    ] = await Promise.all([
      // Current month statistics
      prisma.expense.aggregate({
        where: {
          userId: user.id,
          date: { gte: firstDayOfMonth, lte: lastDayOfMonth },
          isVoid: false
        },
        _sum: { amount: true },
        _avg: { amount: true }
      }),
      // Last month statistics
      prisma.expense.aggregate({
        where: {
          userId: user.id,
          date: { gte: firstDayLastMonth, lte: lastDayLastMonth },
          isVoid: false
        },
        _sum: { amount: true },
        _avg: { amount: true }
      }),
      // Monthly statistics
      prisma.$transaction([
        prisma.expense.aggregate({
          where: {
            userId: user.id,
            date: {
              gte: firstDayOfMonth,
              lte: lastDayOfMonth
            },
            isVoid: false
          },
          _sum: { amount: true },
          _avg: { amount: true }
        }),
        prisma.income.aggregate({
          where: {
            userId: user.id,
            date: {
              gte: firstDayOfMonth,
              lte: lastDayOfMonth
            },
            isVoid: false
          },
          _sum: { amount: true }
        })
      ]),

      // Category distribution
      prisma.expense.groupBy({
        by: ['categoryId'],
        where: {
          userId: user.id,
          date: {
            gte: firstDayOfMonth,
            lte: lastDayOfMonth
          },
          isVoid: false
        },
        _sum: { amount: true },
        orderBy: {
          _sum: { amount: 'desc' }
        }
      }),

      // Recent transactions (both expenses and incomes)
      prisma.$transaction([
        prisma.expense.findMany({
          where: {
            userId: user.id,
            isVoid: false
          },
          include: {
            category: true,
            paymentMethod: true
          },
          orderBy: { date: 'desc' },
          take: 5
        }),
        prisma.income.findMany({
          where: {
            userId: user.id,
            isVoid: false
          },
          include: {
            category: true,
            paymentMethod: true
          },
          orderBy: { date: 'desc' },
          take: 5
        })
      ]),

      // Monthly spending trends
      prisma.expense.groupBy({
        by: ['date'],
        where: {
          userId: user.id,
          date: {
            gte: sixMonthsAgo
          },
          isVoid: false
        },
        _sum: { amount: true }
      })
    ]);

    // Process category distribution
    const categoryIds = categoryDistribution.map((c: CategoryDistribution) => c.categoryId);
    const categories = await prisma.category.findMany({
      where: { id: { in: categoryIds } }
    });

    // Combine and format the data
    const [expenses, incomes] = recentTransactions;
    const monthlyExpenses = monthlyStats[0];
    const monthlyIncome = monthlyStats[1];

    // Calculate percentage changes
    const totalSpent = currentMonthStats._sum.amount || 0;
    const lastMonthTotalSpent = lastMonthStats._sum.amount || 0;
    const averageDaily = currentMonthStats._avg.amount || 0;
    const lastMonthAverageDaily = lastMonthStats._avg.amount || 0;
    
    const calculatePercentChange = (current: number, previous: number) => {
      if (previous === 0) return 0;
      return ((current - previous) / previous) * 100;
    };

    const response: DashboardData = {
      stats: {
        totalSpent: totalSpent || 0,
        averageDaily: averageDaily || 0,
        monthlyBudget: user.preferences?.monthlyBudget || 0,
        totalIncome: monthlyIncome?._sum?.amount || 0,
        changes: {
          totalSpent: calculatePercentChange(totalSpent, lastMonthTotalSpent),
          averageDaily: calculatePercentChange(averageDaily, lastMonthAverageDaily),
          monthlyBudget: 0
        }
      },
      monthlyTrends: monthlyTrends.reduce((acc: TrendAccumulator[], curr: MonthlyTrend) => {
        const month = new Date(curr.date).toLocaleString('default', { month: 'short' });
        const existing = acc.find(item => item.month === month);
        if (existing) {
          existing.amount += curr._sum.amount || 0;
        } else {
          acc.push({ month, amount: curr._sum.amount || 0 });
        }
        return acc;
      }, []),
      expenseCategories: categoryDistribution.map(dist => ({
        name: categories.find(c => c.id === dist.categoryId)?.name || 'Unknown',
        value: dist._sum.amount || 0
      })),
      recentTransactions: [...expenses.map(t => ({
        id: t.id,
        name: t.description || 'No description',
        amount: t.amount || 0,
        type: 'expense' as const,
        category: t.category.name,
        date: t.date.toISOString(),
        paymentMethod: t.paymentMethod.name
      })), ...incomes.map(t => ({
        id: t.id,
        name: t.description || 'No description',
        amount: t.amount || 0,
        type: 'income' as const,
        category: t.category.name,
        date: t.date.toISOString(),
        paymentMethod: t.paymentMethod.name
      }))].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5)
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Dashboard data fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}

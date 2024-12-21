import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import type { DashboardData } from '@/types/dashboard';

const getPrismaErrorMessage = (errorCode: string): string => {
  const errorMessages: Record<string, string> = {
    P2002: 'A unique constraint would be violated.',
    P2014: 'The change you are trying to make would violate data integrity.',
    P2003: 'Foreign key constraint failed.',
    DEFAULT: 'An unknown database error occurred.'
  };
  return errorMessages[errorCode] || errorMessages.DEFAULT;
};

const getDashboardDateRanges = () => {
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
  
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);

  return {
    firstDayOfMonth,
    lastDayOfMonth,
    firstDayLastMonth,
    lastDayLastMonth,
    sixMonthsAgo
  };
};

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

export async function GET(): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dashboardData = await prisma.$transaction(async (prismaClient) => {
      const user = await prismaClient.user.findUniqueOrThrow({
        where: { email: session.user.email },
        include: {
          preferences: {
            select: {
              monthlyBudget: true,
              currency: true
            }
          }
        }
      });

      const dates = getDashboardDateRanges();

      // Execute queries in parallel without nested transactions
      const [
        currentMonthStats,
        lastMonthStats,
        monthlyStats,
        categoryDistribution,
        recentTransactions,
        monthlyTrends
      ] = await Promise.all([
        prismaClient.expense.aggregate({
          where: {
            userId: user.id,
            date: { gte: dates.firstDayOfMonth, lte: dates.lastDayOfMonth },
            isVoid: false
          },
          _sum: { amount: true },
          _avg: { amount: true }
        }),
        prismaClient.expense.aggregate({
          where: {
            userId: user.id,
            date: { gte: dates.firstDayLastMonth, lte: dates.lastDayLastMonth },
            isVoid: false
          },
          _sum: { amount: true },
          _avg: { amount: true }
        }),
        Promise.all([
          prismaClient.expense.aggregate({
            where: {
              userId: user.id,
              date: {
                gte: dates.firstDayOfMonth,
                lte: dates.lastDayOfMonth
              },
              isVoid: false
            },
            _sum: { amount: true },
            _avg: { amount: true }
          }),
          prismaClient.income.aggregate({
            where: {
              userId: user.id,
              date: {
                gte: dates.firstDayOfMonth,
                lte: dates.lastDayOfMonth
              },
              isVoid: false
            },
            _sum: { amount: true }
          })
        ]),
        prismaClient.expense.groupBy({
          by: ['categoryId'],
          where: {
            userId: user.id,
            date: {
              gte: dates.firstDayOfMonth,
              lte: dates.lastDayOfMonth
            },
            isVoid: false
          },
          _sum: { amount: true },
          orderBy: {
            _sum: { amount: 'desc' }
          }
        }),
        Promise.all([
          prismaClient.expense.findMany({
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
          prismaClient.income.findMany({
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
        prismaClient.expense.groupBy({
          by: ['date'],
          where: {
            userId: user.id,
            date: {
              gte: dates.sixMonthsAgo
            },
            isVoid: false
          },
          _sum: { amount: true }
        })
      ]);

      // Process category distribution
      const categoryIds = categoryDistribution.map((c: CategoryDistribution) => c.categoryId);
      const categories = await prismaClient.category.findMany({
        where: { id: { in: categoryIds } }
      });

      // Destructure monthly stats
      const [monthlyExpenses, monthlyIncome] = monthlyStats;
      const [expenses, incomes] = recentTransactions;

      // Combine and format the data
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

      return response;
    });

    return NextResponse.json(dashboardData);
  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError) {
      const errorMessage = getPrismaErrorMessage(error.code);
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }
    
    // Improved error handling
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch dashboard data';
    console.error('Dashboard data fetch error:', errorMessage);
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

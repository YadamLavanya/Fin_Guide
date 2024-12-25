import { prisma } from '@/lib/prisma';
import { calculateNextProcessDate, shouldProcessRecurring } from './dates';

async function processRecurringExpenses() {
  const recurringExpenses = await prisma.recurringExpense.findMany({
    where: {
      OR: [
        { endDate: null },
        { endDate: { gt: new Date() } }
      ]
    },
    include: {
      expense: {
        include: {
          category: true,
          paymentMethod: true,
        }
      },
      pattern: true
    }
  });

  for (const recurring of recurringExpenses) {
    if (!shouldProcessRecurring(recurring.nextProcessDate, recurring.endDate)) {
      continue;
    }

    try {
      await prisma.$transaction(async (tx) => {
        // Create new expense
        const newExpense = await tx.expense.create({
          data: {
            userId: recurring.expense.userId,
            description: recurring.expense.description,
            amount: recurring.expense.amount,
            categoryId: recurring.expense.categoryId,
            paymentMethodId: recurring.expense.paymentMethodId,
            date: recurring.nextProcessDate,
            notes: recurring.expense.notes,
          }
        });

        // Calculate next process date
        const nextProcessDate = calculateNextProcessDate(
          recurring.nextProcessDate,
          recurring.pattern.type,
          recurring.pattern.frequency,
          recurring.pattern.dayOfMonth,
          recurring.pattern.dayOfWeek,
          recurring.pattern.monthOfYear
        );

        // Update recurring expense
        await tx.recurringExpense.update({
          where: { id: recurring.id },
          data: {
            lastProcessed: recurring.nextProcessDate,
            nextProcessDate
          }
        });
      });
    } catch (error) {
      console.error(`Failed to process recurring expense ${recurring.id}:`, error);
    }
  }
}

async function processRecurringIncomes() {
  const recurringIncomes = await prisma.recurringIncome.findMany({
    where: {
      OR: [
        { endDate: null },
        { endDate: { gt: new Date() } }
      ]
    },
    include: {
      income: {
        include: {
          category: true,
          paymentMethod: true,
        }
      },
      pattern: true
    }
  });

  for (const recurring of recurringIncomes) {
    if (!shouldProcessRecurring(recurring.nextProcessDate, recurring.endDate)) {
      continue;
    }

    try {
      await prisma.$transaction(async (tx) => {
        // Create new income
        const newIncome = await tx.income.create({
          data: {
            userId: recurring.income.userId,
            description: recurring.income.description,
            amount: recurring.income.amount,
            categoryId: recurring.income.categoryId,
            paymentMethodId: recurring.income.paymentMethodId,
            date: recurring.nextProcessDate,
            notes: recurring.income.notes,
          }
        });

        // Calculate next process date
        const nextProcessDate = calculateNextProcessDate(
          recurring.nextProcessDate,
          recurring.pattern.type,
          recurring.pattern.frequency,
          recurring.pattern.dayOfMonth,
          recurring.pattern.dayOfWeek,
          recurring.pattern.monthOfYear
        );

        // Update recurring income
        await tx.recurringIncome.update({
          where: { id: recurring.id },
          data: {
            lastProcessed: recurring.nextProcessDate,
            nextProcessDate
          }
        });
      });
    } catch (error) {
      console.error(`Failed to process recurring income ${recurring.id}:`, error);
    }
  }
}

export async function processAllRecurringTransactions() {
  try {
    await processRecurringExpenses();
    await processRecurringIncomes();
  } catch (error) {
    console.error('Failed to process recurring transactions:', error);
  }
} 
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { createLLMProvider } from '@/lib/llm/factory';
import { generateLLMPrompt } from '@/lib/llm/utils';
import type { TransactionData, InsightData } from '@/lib/llm/types';
import { prisma } from '@/lib/prisma';
import { llmLogger } from '@/lib/llm/logging';

// Add basic insights generation for when LLM is not available
function generateBasicInsights(transactionData: TransactionData) {
  const insights = [];
  const tips = [];
  
  // Calculate basic financial metrics
  const totalExpenses = transactionData.totalExpenses;
  const totalIncome = transactionData.totalIncome;
  const balance = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

  // Add basic insights
  insights.push(`Your total expenses are $${totalExpenses.toFixed(2)}`);
  insights.push(`Your total income is $${totalIncome.toFixed(2)}`);
  
  // Add category-specific insights
  const expenseCategories = transactionData.categories
    .filter(c => c.type === 'expense')
    .sort((a, b) => b.totalAmount - a.totalAmount);

  if (expenseCategories.length > 0) {
    insights.push(`Your highest spending category is ${expenseCategories[0].name} at $${expenseCategories[0].totalAmount.toFixed(2)}`);
  }

  // Add basic financial tips
  if (balance < 0) {
    tips.push("Your expenses exceed your income. Consider reviewing your budget.");
    tips.push("Look for areas where you can reduce spending.");
  } else {
    tips.push(`You're saving ${savingsRate.toFixed(1)}% of your income.`);
    if (savingsRate < 20) {
      tips.push("Consider setting aside more for savings if possible.");
    }
  }

  return {
    insights,
    tips,
    summary: `Monthly Summary: Income $${totalIncome.toFixed(2)}, Expenses $${totalExpenses.toFixed(2)}, Balance $${balance.toFixed(2)}`
  };
}

// Add response type validation
function validateLLMResponse(response: any): response is InsightData {
  const hasRequiredArrays = 
    Array.isArray(response?.insights) &&
    Array.isArray(response?.tips) &&
    Array.isArray(response?.monthOverMonth?.changes) &&
    Array.isArray(response?.budgetAlerts) &&
    Array.isArray(response?.goals);

  const hasRequiredFields =
    typeof response?.summary === 'string' &&
    Array.isArray(response?.monthOverMonth?.insights);

  // Add budget analysis for categories over budget
  if (hasRequiredArrays && response.budgetAlerts.length === 0) {
    response.budgetAlerts = response.monthOverMonth.changes
      .filter(change => change.percentageChange > 10)
      .map(change => ({
        category: change.category,
        severity: change.percentageChange > 20 ? 'high' : 'medium',
        message: `${change.category} spending increased by ${change.percentageChange.toFixed(1)}%`,
        percentage: change.percentageChange
      }));
  }

  // Generate meaningful goals if none exist or if they're invalid
  if (hasRequiredArrays) {
    const categories = response.monthOverMonth.changes
      .filter(change => change.percentageChange > 0)
      .sort((a, b) => b.percentageChange - a.percentageChange);
    
    response.goals = categories.map(cat => {
      const targetAmount = Math.min(cat.previousAmount, cat.currentAmount);
      const currentAmount = cat.currentAmount;
      const progress = currentAmount > targetAmount 
        ? Math.max(0, 100 - ((currentAmount - targetAmount) / targetAmount * 100))
        : 100;

      return {
        category: cat.category,
        current: currentAmount,
        target: targetAmount,
        progress: Math.round(progress),
        type: 'reduction',
        description: `Reduce ${cat.category} spending to ${targetAmount.toLocaleString('en-US', {
          style: 'currency',
          currency: 'USD'
        })}`
      };
    });

    // Add savings goal if missing
    const monthlyIncome = response.monthOverMonth.changes
      .find(c => c.category === 'Income')?.currentAmount || 0;
    const targetSavings = monthlyIncome * 0.2; // 20% of income
    const currentSavings = monthlyIncome - response.totalExpenses;
    const savingsProgress = Math.min(100, (currentSavings / targetSavings) * 100);

    response.goals.push({
      category: 'Monthly Savings',
      current: currentSavings,
      target: targetSavings,
      progress: Math.max(0, Math.round(savingsProgress)),
      type: 'savings',
      description: 'Save 20% of monthly income'
    });
  }

  return hasRequiredArrays && hasRequiredFields;
}

export async function GET(req: Request) {
  const startTime = Date.now();
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get API keys and config from headers
    const llmProvider = req.headers.get('x-llm-provider') || 'groq';
    const apiKey = req.headers.get('x-api-key');
    const llmConfig = req.headers.get('x-llm-config');

    // Fetch user data first
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        preferences: true,
        expenses: {
          where: { 
            isVoid: false,
            date: {
              gte: new Date(new Date().setDate(1)), // Start of current month
              lt: new Date(new Date().setMonth(new Date().getMonth() + 1)) // Start of next month
            }
          },
          include: { category: true }
        },
        incomes: {
          where: { 
            isVoid: false,
            date: {
              gte: new Date(new Date().setDate(1)),
              lt: new Date(new Date().setMonth(new Date().getMonth() + 1))
            }
          },
          include: { category: true }
        },
        categories: {
          include: {
            type: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Initialize transactionData before checking apiKey
    const previousMonthStart = new Date(new Date().setMonth(new Date().getMonth() - 1));
    previousMonthStart.setDate(1);
    const previousMonthEnd = new Date(new Date().setDate(0));

    const previousMonthData = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        expenses: {
          where: { 
            isVoid: false,
            date: {
              gte: previousMonthStart,
              lt: previousMonthEnd
            }
          },
          include: { category: true }
        },
        incomes: {
          where: { 
            isVoid: false,
            date: {
              gte: previousMonthStart,
              lt: previousMonthEnd
            }
          },
          include: { category: true }
        },
        categories: {
          include: { type: true }
        }
      }
    });

    // Use the monthly budget from preferences instead of budget limits
    const monthlyBudget = user.preferences?.monthlyBudget || 0;

    const transactionData: TransactionData = {
      totalExpenses: user.expenses.reduce((sum, exp) => sum + exp.amount, 0),
      totalIncome: user.incomes.reduce((sum, inc) => sum + inc.amount, 0),
      categories: user.categories.map(cat => ({
        name: cat.name,
        totalAmount: user.expenses
          .filter(exp => exp.categoryId === cat.id)
          .reduce((sum, exp) => sum + exp.amount, 0),
        type: cat.type.name.toLowerCase().includes('expense') ? 'expense' : 'income',
        budget: cat.budget || undefined,
        // Add target amounts from category budgets
        target: cat.budget || undefined
      })),
      previousMonth: previousMonthData ? {
        totalIncome: previousMonthData.incomes.reduce((sum, inc) => sum + inc.amount, 0),
        totalExpenses: previousMonthData.expenses.reduce((sum, exp) => sum + exp.amount, 0),
        categories: previousMonthData.categories.map(cat => ({
          name: cat.name,
          totalAmount: previousMonthData.expenses
            .filter(exp => exp.categoryId === cat.id)
            .reduce((sum, exp) => sum + exp.amount, 0),
          type: cat.type.name.toLowerCase().includes('expense') ? 'expense' : 'income'
        }))
      } : undefined,
      monthlyBudget // Add overall monthly budget from preferences
    };

    if (!apiKey) {
      return NextResponse.json(generateBasicInsights(transactionData));
    }

    try {
      const config = {
        apiKey,
        ...(llmConfig ? JSON.parse(llmConfig) : {})
      };

      const provider = createLLMProvider(llmProvider, config);
      const llmResponse = await provider.analyze(transactionData, generateLLMPrompt(transactionData));

      if (validateLLMResponse(llmResponse)) {
        llmLogger.log({
          timestamp: new Date().toISOString(),
          provider: llmProvider,
          prompt: generateLLMPrompt(transactionData),
          response: llmResponse,
          duration: Date.now() - startTime,
          success: true,
          level: 'info'
        });
        return NextResponse.json(llmResponse);
      }

      throw new Error('Invalid LLM response format');
    } catch (llmError) {
      llmLogger.log({
        timestamp: new Date().toISOString(),
        provider: llmProvider,
        prompt: generateLLMPrompt(transactionData),
        error: llmError,
        duration: Date.now() - startTime,
        success: false,
        level: 'error'
      });
      return NextResponse.json(generateBasicInsights(transactionData));
    }
    
  } catch (error) {
    llmLogger.log({
      timestamp: new Date().toISOString(),
      provider: 'system',
      prompt: 'API request',
      error,
      duration: Date.now() - startTime,
      success: false,
      level: 'error'
    });
    return NextResponse.json(
      { error: 'Failed to generate insights' },
      { status: 500 }
    );
  }
}

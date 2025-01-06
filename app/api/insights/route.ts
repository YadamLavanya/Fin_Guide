import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { createLLMProvider } from '@/lib/llm/factory';
import { generateLLMPrompt } from '@/lib/llm/utils';
import type { TransactionData, InsightData } from '@/lib/llm/types';
import { prisma } from '@/lib/prisma';
import { llmLogger } from '@/lib/llm/logging';
import { authOptions } from '@/lib/auth';

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

function generateComprehensiveInsights(transactionData: TransactionData) {
  const insights = [];
  const goals = [];
  
  // Calculate core metrics
  const totalExpenses = transactionData.totalExpenses;
  const totalIncome = transactionData.totalIncome;
  const balance = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

  // Generate category analysis
  const expenseCategories = transactionData.categories
    .filter(c => c.type === 'expense')
    .sort((a, b) => b.totalAmount - a.totalAmount);

  // Monthly trends with filtered changes
  const monthOverMonth = {
    insights: [],
    changes: transactionData.previousMonth ? transactionData.categories
      .map(cat => {
        const prevCat = transactionData.previousMonth?.categories.find(c => c.name === cat.name);
        const prevAmount = prevCat?.totalAmount || 0;
        const change = prevAmount > 0 ? ((cat.totalAmount - prevAmount) / prevAmount) * 100 : 0;
        
        return {
          category: cat.name,
          previousAmount: prevAmount,
          currentAmount: cat.totalAmount,
          percentageChange: change
        };
      })
      .filter(change => Math.abs(change.percentageChange) > 0) // Only include actual changes
      .sort((a, b) => Math.abs(b.percentageChange) - Math.abs(a.percentageChange)) // Sort by magnitude
    : []
  };

  // Add month-over-month insights
  if (transactionData.previousMonth) {
    const totalChangePercent = ((totalExpenses - transactionData.previousMonth.totalExpenses) / transactionData.previousMonth.totalExpenses) * 100;
    monthOverMonth.insights.push(
      `Overall spending ${totalChangePercent > 0 ? 'increased' : 'decreased'} by ${Math.abs(totalChangePercent).toFixed(1)}% compared to last month`
    );
  }

  // Enhanced budget alerts generation
  const budgetAlerts = []; // Keep only this declaration
  
  // Category budget alerts
  transactionData.categories
    .filter(cat => cat.type === 'expense' && cat.budget)
    .forEach(cat => {
      const percentage = (cat.totalAmount / cat.budget!) * 100;
      const remaining = cat.budget! - cat.totalAmount;

      if (percentage >= 100) {
        budgetAlerts.push({
          category: cat.name,
          severity: percentage >= 120 ? 'high' : 'medium',
          message: `${cat.name} is over budget by ${(percentage - 100).toFixed(1)}% ($${(-remaining).toFixed(2)})`,
          current: cat.totalAmount,
          limit: cat.budget,
          percentage: percentage
        });
      } else if (percentage >= 80) {
        budgetAlerts.push({
          category: cat.name,
          severity: 'low',
          message: `${cat.name} is approaching budget limit ($${remaining.toFixed(2)} remaining)`,
          current: cat.totalAmount,
          limit: cat.budget,
          percentage: percentage
        });
      }
    });

  // Overall monthly budget alert
  if (transactionData.monthlyBudget && transactionData.monthlyBudget > 0) {
    const overallPercentage = (totalExpenses / transactionData.monthlyBudget) * 100;
    const remainingBudget = transactionData.monthlyBudget - totalExpenses;

    if (overallPercentage >= 100) {
      budgetAlerts.unshift({
        category: 'Overall',
        severity: 'high',
        message: `Total spending exceeds monthly budget by ${(overallPercentage - 100).toFixed(1)}% ($${(-remainingBudget).toFixed(2)})`,
        current: totalExpenses,
        limit: transactionData.monthlyBudget,
        percentage: overallPercentage
      });
    } else if (overallPercentage >= 80) {
      budgetAlerts.unshift({
        category: 'Overall',
        severity: 'medium',
        message: `Approaching monthly budget limit ($${remainingBudget.toFixed(2)} remaining)`,
        current: totalExpenses,
        limit: transactionData.monthlyBudget,
        percentage: overallPercentage
      });
    }
  }

  // Sort alerts by severity (high -> medium -> low)
  budgetAlerts.sort((a, b) => {
    const severityOrder = { high: 3, medium: 2, low: 1 };
    return severityOrder[b.severity] - severityOrder[a.severity];
  });

  // Enhanced category analysis
  const categoryAnalysis = expenseCategories.map(cat => ({
    name: cat.name,
    totalAmount: cat.totalAmount,
    percentage: (cat.totalAmount / totalExpenses) * 100,
    trend: transactionData.previousMonth 
      ? ((cat.totalAmount - (transactionData.previousMonth.categories.find(c => c.name === cat.name)?.totalAmount || 0)) /
         (transactionData.previousMonth.categories.find(c => c.name === cat.name)?.totalAmount || 1)) * 100
      : 0
  }));

  // Generate smart goals
  if (savingsRate < 20) {
    goals.push({
      category: 'Savings',
      current: balance,
      target: totalIncome * 0.2,
      progress: (savingsRate / 20) * 100,
      description: 'Build emergency savings - aim for 20% of income',
      type: 'savings'
    });
  }

  expenseCategories.forEach(cat => {
    if (cat.budget && cat.totalAmount > cat.budget) {
      goals.push({
        category: cat.name,
        current: cat.totalAmount,
        target: cat.budget,
        progress: Math.max(0, 100 - ((cat.totalAmount - cat.budget) / cat.budget * 100)),
        description: `Reduce ${cat.name} spending to stay within budget`,
        type: 'reduction'
      });
    }
  });

  return {
    summary: `Monthly Summary: Income $${totalIncome.toFixed(2)}, Expenses $${totalExpenses.toFixed(2)}, Savings Rate ${savingsRate.toFixed(1)}%`,
    monthOverMonth,
    budgetAlerts,
    categoryAnalysis,
    goals,
    stats: {
      savingsRate,
      balance,
      topExpenses: categoryAnalysis.slice(0, 3)
    }
  };
}

// Add response type validation
function validateLLMResponse(response: any): boolean {
  return response && 
         Array.isArray(response.commentary) && 
         Array.isArray(response.tips);
}

export async function GET(req: Request) {
  const startTime = Date.now();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get LLM settings from request headers
    const llmProvider = (req.headers.get('x-llm-provider') || 'groq') as string;
    const apiKey = req.headers.get('x-api-key') || '';
    const llmConfig = req.headers.get('x-llm-config');

    // Initialize provider config
    let providerConfig: any = { apiKey };

    // Parse additional config if provided
    if (llmConfig) {
      try {
        const parsedConfig = JSON.parse(llmConfig);
        providerConfig = { ...providerConfig, ...parsedConfig };
      } catch (e) {
        console.error('Failed to parse LLM config:', e);
      }
    }

    // Simplified user query with only existing fields
    const user = await prisma.user.findUniqueOrThrow({
      where: { email: session.user.email },
      include: {
        preferences: {
          select: {
            monthlyBudget: true,
            currency: true
          }
        },
        expenses: {
          where: { 
            isVoid: false,
            date: {
              gte: new Date(new Date().setDate(1)),
              lt: new Date(new Date().setMonth(new Date().getMonth() + 1))
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

    // Generate computed insights first
    const computedInsights = generateComprehensiveInsights(transactionData);

    // Determine if we should use LLM based on headers
    const shouldUseLLM = llmProvider === 'ollama' || (llmProvider !== 'ollama' && apiKey);

    if (shouldUseLLM) {
      try {
        const provider = createLLMProvider(llmProvider, providerConfig);
        const llmResponse = await provider.analyze(transactionData);

        if (validateLLMResponse(llmResponse)) {
          const finalResponse = {
            ...computedInsights,
            commentary: llmResponse.commentary,
            tips: llmResponse.tips
          };

          llmLogger.log({
            timestamp: new Date().toISOString(),
            provider: llmProvider,
            prompt: generateLLMPrompt(transactionData),
            response: finalResponse,
            duration: Date.now() - startTime,
            success: true,
            level: 'info'
          });

          return NextResponse.json(finalResponse);
        }
      } catch (llmError) {
        llmLogger.log({
          timestamp: new Date().toISOString(),
          provider: llmProvider,
          error: llmError,
          duration: Date.now() - startTime,
          success: false,
          level: 'error'
        });
      }
    }

    // Return computed insights if LLM fails or isn't configured
    return NextResponse.json(computedInsights);
    
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

    // Check if error is due to missing API key
    if (error instanceof Error && 
        (error.message.includes('API key') || 
         error.message.toLowerCase().includes('authentication') ||
         error.message.toLowerCase().includes('unauthorized'))) {
      return NextResponse.json(
        { 
          error: 'API key not configured',
          action: 'configure_llm',
          message: 'Please configure your LLM provider and API key in Settings → AI Settings.'
        },
        { status: 401 }
      );
    }

    // Check for Ollama-specific errors
    if (llmProvider === 'ollama' && error instanceof Error) {
      const isConnectionError = error.message.includes('ECONNREFUSED') || 
                              error.message.includes('Failed to fetch') ||
                              error.message.toLowerCase().includes('connection');
      
      if (isConnectionError) {
        return NextResponse.json(
          {
            error: 'Ollama connection error',
            action: 'configure_llm',
            message: 'Unable to connect to Ollama. Please make sure Ollama is running and accessible at the configured URL.'
          },
          { status: 503 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to generate insights' },
      { status: 500 }
    );
  }
}

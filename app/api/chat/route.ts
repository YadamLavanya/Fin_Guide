import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { createLLMProvider } from '@/lib/llm/factory';
import type { ChatMessage } from '@/lib/llm/types';
import { llmLogger } from '@/lib/llm/logging';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Function to fetch financial data for a specific time range
async function getFinancialData(userId: string, startDate: Date, endDate: Date) {
  return await prisma.user.findUniqueOrThrow({
    where: { id: userId },
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
            gte: startDate,
            lt: endDate
          }
        },
        include: { 
          category: true,
          paymentMethod: true
        }
      },
      incomes: {
        where: { 
          isVoid: false,
          date: {
            gte: startDate,
            lt: endDate
          }
        },
        include: { 
          category: true,
          paymentMethod: true
        }
      },
      categories: {
        include: {
          type: true
        }
      }
    }
  });
}

// Function to check if message requests historical data
function requestsHistoricalData(message: string): boolean {
  const historicalKeywords = [
    'previous month',
    'last month',
    'past months',
    'historical',
    'history',
    'trend',
    'compare',
    'comparison',
    'over time',
    'monthly',
    'past'
  ];
  return historicalKeywords.some(keyword => 
    message.toLowerCase().includes(keyword)
  );
}

export async function POST(req: Request) {
  const startTime = Date.now();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get request body
    const body = await req.json();
    const { messages, systemPrompt } = body;

    if (!Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid messages format' },
        { status: 400 }
      );
    }

    // Check if the latest message requests historical data
    const latestMessage = messages[messages.length - 1]?.content || '';
    const needsHistoricalData = requestsHistoricalData(latestMessage);

    // Set date range based on request
    const endDate = new Date();
    const startDate = needsHistoricalData
      ? new Date(endDate.getFullYear(), endDate.getMonth() - 3, 1) // Last 3 months
      : new Date(endDate.getFullYear(), endDate.getMonth(), 1); // Current month

    // Fetch user's financial data
    const user = await getFinancialData(session.user.id, startDate, endDate);

    // Get LLM settings from request headers
    const llmProvider = (req.headers.get('x-llm-provider') || 'groq') as string;
    const apiKey = req.headers.get('x-api-key') || '';
    const llmConfig = req.headers.get('x-llm-config');

    // Initialize provider config
    let providerConfig: any = { 
      apiKey,
      mode: 'chat'
    };

    // Parse additional config if provided
    if (llmConfig) {
      try {
        const parsedConfig = JSON.parse(llmConfig);
        providerConfig = { ...providerConfig, ...parsedConfig };
      } catch (e) {
        console.error('Failed to parse LLM config:', e);
      }
    }

    // Calculate financial metrics
    const totalExpenses = user.expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const totalIncome = user.incomes.reduce((sum, inc) => sum + inc.amount, 0);
    const monthlyBudget = user.preferences?.monthlyBudget || 0;
    const currency = user.preferences?.currency?.symbol || '$';

    // Prepare category summaries
    const categorySummaries = user.categories.map(cat => ({
      name: cat.name,
      type: cat.type.name,
      budget: cat.budget || 0,
      spent: user.expenses
        .filter(exp => exp.categoryId === cat.id)
        .reduce((sum, exp) => sum + exp.amount, 0)
    }));

    // Add financial context to system prompt
    const enhancedSystemPrompt = `${systemPrompt}

Hi! I'm Curio, your friendly AI financial assistant. I help you make smart money choices and understand your spending better.

IMPORTANT RULES:
1. Keep responses brief and to the point
2. ONLY use the data provided above - DO NOT invent or assume any information
3. If you don't have enough data to answer a question, say so
4. Format responses using markdown:
   - Use **bold** for emphasis
   - Use \`code\` for numbers and amounts
   - Use bullet points for lists
   - Use ### for section headers (if needed)

${needsHistoricalData ? '3-Month' : 'Current Month'} Summary:
Budget: \`${currency}${monthlyBudget}\`
Spent: \`${currency}${totalExpenses}\`
Income: \`${currency}${totalIncome}\`

Recent Expenses:${user.expenses
  .sort((a, b) => b.date.getTime() - a.date.getTime())
  .slice(0, 5)
  .map(exp => `\n- **${exp.category.name}**: \`${currency}${exp.amount}\` (${exp.description})`)
  .join('')}

Category Summary:${categorySummaries
  .filter(cat => cat.spent > 0 || cat.budget > 0)
  .map(cat => `\n- **${cat.name}**: \`${currency}${cat.spent}${cat.budget ? `/${currency}${cat.budget}` : ''}\``)
  .join('')}

Remember: 
- Be friendly and encouraging while keeping responses concise
- Only reference actual data shown above
- If asked about data not shown here, acknowledge that you don't have that information

Initial greeting: "Hey! I'm Curio 👋 How can I help you manage your finances today?"`;

    // If this is the first message, add the initial greeting
    const isFirstMessage = messages.length === 0;
    const chatMessages: ChatMessage[] = [
      { role: 'system', content: enhancedSystemPrompt },
      ...(isFirstMessage ? [{ 
        role: 'assistant', 
        content: "Hey! I'm Curio 👋 How can I help you manage your finances today?" 
      }] : []),
      ...messages
    ];

    // Create LLM provider instance
    try {
      const provider = createLLMProvider(llmProvider as any, providerConfig);

      // Check if provider supports chat
      if (!provider.chat) {
        return NextResponse.json(
          { 
            error: 'Provider not supported',
            action: 'configure_llm',
            message: 'Selected provider does not support chat. Please choose a different provider in Settings.'
          },
          { status: 400 }
        );
      }

      // Get chat response
      const response = await provider.chat(chatMessages);

      llmLogger.log({
        timestamp: new Date().toISOString(),
        provider: llmProvider,
        response,
        duration: Date.now() - startTime,
        success: true,
        level: 'info',
        prompt: enhancedSystemPrompt
      });

      return NextResponse.json(response);
    } catch (error) {
      llmLogger.log({
        timestamp: new Date().toISOString(),
        provider: llmProvider,
        error,
        duration: Date.now() - startTime,
        success: false,
        level: 'error',
        prompt: enhancedSystemPrompt
      });

      // Check for Ollama-specific errors first
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

        // Other Ollama-specific errors
        return NextResponse.json(
          {
            error: 'Ollama error',
            action: 'configure_llm',
            message: `Ollama error: ${error.message}. Please check your Ollama configuration and model settings.`
          },
          { status: 500 }
        );
      }

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

      // Generic error
      return NextResponse.json(
        { error: 'Failed to process chat request' },
        { status: 500 }
      );
    }
  } catch (error) {
    llmLogger.log({
      timestamp: new Date().toISOString(),
      provider: 'system',
      error,
      duration: Date.now() - startTime,
      success: false,
      level: 'error',
      prompt: 'Chat request failed'
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
      { error: 'Failed to process chat request' },
      { status: 500 }
    );
  }
}

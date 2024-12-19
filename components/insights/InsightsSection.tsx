import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, TrendingUp, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

// New imports
import {
  BrainCircuit,
  BarChart,
  Target,
  Bell,
  ArrowUpDown,
  Boxes,
  Coins
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { ErrorBoundary } from '../ErrorBoundary';

const EmptyStateMessages = {
  goals: [
    "No goals yet! Time to dream big! 🌟",
    "Ready to set your first money milestone? 🎯",
    "Your financial journey starts with a goal! ✨",
    "Let's turn those dreams into plans! 🚀"
  ],
  budgetAlerts: [
    "All quiet on the budget front! 🌈",
    "Smooth sailing with your spending! ⛵",
    "No alerts today - keep up the good work! 🌟",
    "Your budget's looking peachy! 🍑"
  ],
  monthOverMonth: [
    "First month? Everyone starts somewhere! 📊",
    "Ready to start tracking your progress! 📈",
    "Next month we'll have some trends to show! 🎯",
    "Your financial story is just beginning! 📖"
  ]
};

interface InsightData {
  insights: string[];
  tips: string[];
  summary: string;
  goals: {
    name: string;
    current: number;
    target: number;
    progress: number;
  }[];
  alerts: {
    type: 'warning' | 'info' | 'success';
    message: string;
  }[];
  comparisons: {
    category: string;
    previousMonth: number;
    currentMonth: number;
    percentageChange: number;
  }[];
}

export function InsightsSectionWrapper() {
  return (
    <ErrorBoundary>
      <InsightsSection />
    </ErrorBoundary>
  );
}

const transformInsightsData = (data: any): InsightData => ({
  summary: data.summary || 'No summary available',
  insights: data.insights || [],
  tips: data.tips || [],
  monthOverMonth: {
    insights: data.monthOverMonth?.insights || [],
    changes: data.monthOverMonth?.changes?.map((change: any) => ({
      category: change.category,
      previousAmount: Number(change.previousAmount) || 0,
      currentAmount: Number(change.currentAmount) || 0,
      percentageChange: Number(change.percentageChange) || 0
    })) || []
  },
  budgetAlerts: data.budgetAlerts?.map((alert: any) => ({
    category: alert.category,
    severity: alert.severity || 'medium',
    message: alert.message,
    percentage: Number(alert.percentage) || 0
  })) || [],
  goals: data.goals?.map((goal: any) => ({
    category: goal.category,
    current: Number(goal.current) || 0,
    target: Number(goal.target) || 0,
    progress: Number(goal.progress) || 0,
    description: goal.description
  })) || []
});

function InsightsSection() {
  const [insights, setInsights] = useState<InsightData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = useCallback(async () => {
    try {
      setLoading(true);
      setError(null); // Clear previous errors
      
      // Get stored LLM preferences from localStorage
      let defaultLLM = 'groq';
      let apiKeys = {};
      let llmConfig = {};

      // Safe localStorage access
      try {
        defaultLLM = localStorage.getItem('default-llm') || 'groq';
        apiKeys = JSON.parse(localStorage.getItem('llm-api-keys') || '{}');
        llmConfig = JSON.parse(localStorage.getItem(`${defaultLLM}-config`) || '{}');
      } catch (e) {
        console.warn('Failed to load LLM preferences from localStorage', e);
      }

      const response = await fetch('/api/insights', {
        headers: {
          'x-llm-provider': defaultLLM,
          'x-api-key': apiKeys[defaultLLM as keyof typeof apiKeys] || '',
          'x-llm-config': JSON.stringify(llmConfig)
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch insights');
      }

      const data = await response.json();
      setInsights(transformInsightsData(data));
    } catch (err) {
      console.error('Insights fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load insights');
    } finally {
      setLoading(false);
    }
  }, []);

  // Use useEffect with error handling
  useEffect(() => {
    fetchInsights().catch(err => {
      console.error('Effect error:', err);
      setError('Failed to initialize insights');
      setLoading(false);
    });
  }, [fetchInsights]);

  const getEmptyStateCard = (
    title: string, 
    icon: React.ReactNode, 
    message: string, 
    submessage: string
  ) => (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center text-center p-6">
          <p className="text-sm text-muted-foreground mb-2">{message}</p>
          <p className="text-sm text-muted-foreground">{submessage}</p>
        </div>
      </CardContent>
    </Card>
  );

  const getEmptyStateMessage = (section: string) => {
    const messages = {
      overview: {
        icon: <BrainCircuit className="h-5 w-5 text-muted-foreground" />,
        title: "Monthly Overview",
        message: "Still analyzing your finances! 🤔",
        submessage: "Add more transaction data for a complete picture."
      },
      insights: {
        icon: <BarChart className="h-5 w-5 text-muted-foreground" />,
        title: "Key Insights",
        message: "Not enough data for insights yet! 📊",
        submessage: "Keep tracking your transactions."
      },
      goals: {
        icon: <Target className="h-5 w-5 text-muted-foreground" />,
        title: "Financial Goals",
        message: "Ready to set some goals? 🎯",
        submessage: "Let's start planning your financial future."
      },
      alerts: {
        icon: <Bell className="h-5 w-5 text-muted-foreground" />,
        title: "Budget Alerts",
        message: "Nothing to report yet! 🔔",
        submessage: "We'll notify you of important changes."
      },
      comparisons: {
        icon: <ArrowUpDown className="h-5 w-5 text-muted-foreground" />,
        title: "Month-over-Month",
        message: "Waiting for more history! 📅",
        submessage: "Come back next month for spending trends."
      },
      categories: {
        icon: <Boxes className="h-5 w-5 text-muted-foreground" />,
        title: "Category Analysis",
        message: "Categories are shy! 🙈",
        submessage: "Add more transactions to see patterns."
      },
      tips: {
        icon: <Lightbulb className="h-5 w-5 text-muted-foreground" />,
        title: "Tips & Recommendations",
        message: "My advice engine is warming up! 💡",
        submessage: "Add transactions to get personalized tips."
      }
    };

    // Return default message if section is not found
    return messages[section as keyof typeof messages] || {
      icon: <AlertCircle className="h-5 w-5 text-muted-foreground" />,
      title: "Section",
      message: "No data available yet! 📝",
      submessage: "Add some transactions to get started."
    };
  };

  const getRandomMessage = (section: keyof typeof EmptyStateMessages) => {
    const messages = EmptyStateMessages[section];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  const renderSection = (section: string, content: React.ReactNode) => {
    const isEmpty = (data: any) => {
      if (Array.isArray(data)) return data.length === 0;
      if (typeof data === 'string') return !data.trim();
      if (typeof data === 'object' && data !== null) {
        return Object.keys(data).length === 0;
      }
      return !data;
    };

    const sectionData = getEmptyStateMessage(section);
    const isEmptySection = !insights || isEmpty(content);

    if (isEmptySection) {
      let emptyMessage = sectionData.message;
      if (section === 'goals') {
        emptyMessage = getRandomMessage('goals');
      } else if (section === 'alerts') {
        emptyMessage = getRandomMessage('budgetAlerts');
      } else if (section === 'comparisons') {
        emptyMessage = getRandomMessage('monthOverMonth');
      }

      return (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {sectionData.icon}
              {sectionData.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center text-center p-6">
              <p className="text-sm text-muted-foreground mb-2">{emptyMessage}</p>
              <p className="text-sm text-muted-foreground">{sectionData.submessage}</p>
            </div>
          </CardContent>
        </Card>
      );
    }

    return content;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="h-[200px]">
            <CardHeader>
              <Skeleton className="h-6 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mt-2" />
              <Skeleton className="h-4 w-3/4 mt-2" />
              <Skeleton className="h-4 w-1/2 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            Error Loading Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600">{error}</p>
        </CardContent>
      </Card>
    );
  }

  // Complete empty state for no data
  if (!insights?.insights?.length && !insights?.tips?.length) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {getEmptyStateCard(
          "Monthly Overview",
          <BrainCircuit className="h-5 w-5 text-muted-foreground" />,
          "Your financial story is a blank canvas! 📝",
          "Add some transactions and I'll help paint the picture."
        )}
        {getEmptyStateCard(
          "Financial Goals",
          <Target className="h-5 w-5 text-muted-foreground" />,
          "No goals set yet! 🎯",
          "Dreams need numbers - let's set some targets together."
        )}
        {getEmptyStateCard(
          "Budget Alerts",
          <Bell className="h-5 w-5 text-muted-foreground" />,
          "All quiet on the financial front! 🔔",
          "Start tracking to get smart notifications about your spending."
        )}
        {getEmptyStateCard(
          "Spending Analysis",
          <BarChart className="h-5 w-5 text-muted-foreground" />,
          "Your expenses are playing hide and seek! 🙈",
          "Add transactions to reveal where your money goes."
        )}
        {getEmptyStateCard(
          "Monthly Comparisons",
          <ArrowUpDown className="h-5 w-5 text-muted-foreground" />,
          "No trends to show yet! 📊",
          "Give me a month's worth of data to spot patterns."
        )}
        {getEmptyStateCard(
          "Tips & Recommendations",
          <Lightbulb className="h-5 w-5 text-muted-foreground" />,
          "My advice engine is hungry for data! 💡",
          "Feed me some transactions and I'll share money-smart tips."
        )}
      </div>
    );
  }

  if (!insights) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold tracking-tight">AI Financial Insights</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchInsights}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Summary Card */}
        {renderSection("overview", 
          <Card className="col-span-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BrainCircuit className="h-5 w-5" />
                Monthly Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{insights?.summary}</p>
            </CardContent>
          </Card>
        )}

        {/* Insights Cards */}
        {renderSection("insights", 
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart className="h-5 w-5" />
                Key Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {insights.insights.map((insight, index) => (
                  <li key={index} className="flex gap-2 items-start">
                    <TrendingUp className="h-4 w-4 mt-1 shrink-0 text-primary" />
                    <span className="text-sm text-muted-foreground">{insight}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Tips Cards */}
        {renderSection("tips", 
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {insights.tips.map((tip, index) => (
                  <li key={index} className="flex gap-2 items-start">
                    <AlertCircle className="h-4 w-4 mt-1 shrink-0 text-primary" />
                    <span className="text-sm text-muted-foreground">{tip}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* New: Financial Goals */}
        {renderSection("goals", 
          <Card className="col-span-full md:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Financial Goals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {insights?.goals?.map((goal, index) => {
                  if (!goal?.category) return null;
                  
                  const progressValue = Math.min(Math.max(0, goal.progress || 0), 100);
                  const isReduction = goal.type === 'reduction';
                  
                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{goal.category}</span>
                        <span className={cn(
                          "text-muted-foreground",
                          isReduction && goal.current > goal.target ? "text-red-500" : "text-green-500"
                        )}>
                          {goal.current.toLocaleString('en-US', {
                            style: 'currency',
                            currency: 'USD'
                          })} / {goal.target.toLocaleString('en-US', {
                            style: 'currency',
                            currency: 'USD'
                          })}
                        </span>
                      </div>
                      <div className="relative pt-4">
                        <Progress 
                          value={progressValue}
                          variant={isReduction ? 'warning' : 'success'}
                          className={cn(
                            "h-2",
                            isReduction ? "bg-red-100" : "bg-green-100"
                          )}
                        />
                        <span className="absolute right-0 top-0 text-xs text-muted-foreground">
                          {Math.round(progressValue)}%
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {goal.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Budget Alerts section with null checks */}
        {renderSection("alerts", 
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Budget Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {insights?.budgetAlerts?.map((alert, index) => {
                  if (!alert?.message) return null;
                  
                  return (
                    <div key={index} 
                      className={`p-3 rounded-lg flex items-start gap-2
                        ${alert.severity === 'high' ? 'bg-red-50 text-red-700' :
                          alert.severity === 'medium' ? 'bg-yellow-50 text-yellow-700' :
                          'bg-blue-50 text-blue-700'}`}>
                      <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                      <div className="space-y-1 flex-1">
                        <p className="text-sm font-medium">{alert.message}</p>
                        {alert.current != null && alert.limit != null && (
                          <div className="text-xs flex justify-between">
                            <span>
                              ${(alert.current || 0).toLocaleString()} / ${(alert.limit || 0).toLocaleString()}
                            </span>
                            <span>{alert.percentage || 0}% used</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Update Monthly Comparisons section */}
        {renderSection("comparisons", 
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowUpDown className="h-5 w-5" />
                Month-over-Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {insights?.monthOverMonth?.changes?.map((change, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{change.category}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${
                        (change.percentageChange || 0) > 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {(change.percentageChange || 0) > 0 ? '↑' : '↓'}
                        {Math.abs(change.percentageChange || 0).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* New: Category Breakdown */}
        {renderSection("categories", 
          <Card className="col-span-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Boxes className="h-5 w-5" />
                Spending Categories Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {insights?.insights
                  .filter(insight => insight.includes('category') || insight.includes('spending'))
                  .map((insight, index) => (
                    <div key={index} className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
                      <BarChart className="h-4 w-4 mt-0.5 text-primary" />
                      <span className="text-sm">{insight}</span>
                    </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
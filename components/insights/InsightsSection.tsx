import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, TrendingUp, AlertCircle, Settings } from "lucide-react";
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

interface InsightData {
  summary: string;
  commentary?: string[];
  tips?: string[];
  monthOverMonth: {
    insights: string[];
    changes: {
      category: string;
      previousAmount: number;
      currentAmount: number;
      percentageChange: number;
    }[];
  };
  budgetAlerts: {
    category: string;
    severity: 'high' | 'medium' | 'low';
    message: string;
    percentage: number;
  }[];
  goals: {
    category: string;
    current: number;
    target: number;
    progress: number;
    description: string;
    type: 'reduction' | 'savings';
  }[];
  stats: {
    savingsRate: number;
    balance: number;
    topExpenses: Array<{
      name: string;
      totalAmount: number;
      type: string;
    }>;
  };
  categoryAnalysis?: Array<{
    name: string;
    totalAmount: number;
    percentage: number;
    trend: number;
  }>;
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
  commentary: data.commentary || [],
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
  })) || [],
  stats: {
    savingsRate: data.stats?.savingsRate || 0,
    balance: data.stats?.balance || 0,
    topExpenses: data.stats?.topExpenses?.map((expense: any) => ({
      name: expense.name,
      totalAmount: Number(expense.totalAmount) || 0,
      type: expense.type
    })) || []
  },
  categoryAnalysis: data.categoryAnalysis?.map((category: any) => ({
    name: category.name,
    totalAmount: Number(category.totalAmount) || 0,
    percentage: Number(category.percentage) || 0,
    trend: Number(category.trend) || 0
  })) || []
});

function InsightsSection() {
  const [insights, setInsights] = useState<InsightData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);

  const fetchInsights = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setConfigError(null);
      
      let defaultLLM = 'groq';
      let apiKeys = {};
      let llmConfig = {};

      try {
        defaultLLM = localStorage.getItem('default-llm') || 'groq';
        apiKeys = JSON.parse(localStorage.getItem('llm-api-keys') || '{}');
        llmConfig = JSON.parse(localStorage.getItem(`${defaultLLM}-config`) || '{}');
      } catch (e) {
        console.warn('Failed to load LLM preferences from localStorage', e);
      }

      // Check if API key exists before making the request
      if (defaultLLM !== 'ollama' && !apiKeys[defaultLLM as keyof typeof apiKeys]) {
        setError('configuration_required');
        setConfigError('Please configure your LLM provider and API key in Settings → AI Settings.');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/insights', {
        headers: {
          'x-llm-provider': defaultLLM,
          'x-api-key': apiKeys[defaultLLM as keyof typeof apiKeys] || '',
          'x-llm-config': JSON.stringify(llmConfig)
        }
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401 && data.action === 'configure_llm') {
          setError('configuration_required');
          setConfigError(data.message);
          return;
        }
        if (response.status === 503 && data.error === 'Ollama connection error') {
          setError('configuration_required');
          setConfigError(data.message);
          return;
        }
        throw new Error(data.error || 'Failed to fetch insights');
      }

      const transformedData = transformInsightsData(data);
      
      // Only set insights if there's meaningful data
      if (transformedData.commentary?.length || transformedData.tips?.length) {
        setInsights(transformedData);
      } else {
        setInsights(null);
      }
    } catch (err) {
      console.error('Insights fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load insights');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInsights().catch(err => {
      console.error('Effect error:', err);
      setError('Failed to initialize insights');
      setLoading(false);
    });
  }, [fetchInsights]);

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

  if (error === 'configuration_required' && configError) {
    return (
      <Card className="border-yellow-200 bg-yellow-50/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-600">
            <AlertCircle className="h-5 w-5" />
            Configuration Required
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-yellow-600 mb-4">{configError}</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => window.location.href = '/dashboard/settings'}
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            Go to Settings
          </Button>
        </CardContent>
      </Card>
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

  if (!insights) return null;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Summary Card with Commentary */}
        <Card className="col-span-full bg-gradient-to-br from-background to-muted">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <BrainCircuit className="h-5 w-5 text-primary" />
                Monthly Overview & AI Commentary
              </CardTitle>
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
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-card p-4 border shadow-sm">
              <p className="text-sm text-muted-foreground leading-relaxed">{insights?.summary}</p>
            </div>
            {insights?.commentary && insights.commentary.length > 0 && (
              <div className="space-y-3 border-t pt-4">
                <p className="text-sm font-medium text-foreground">Key Observations:</p>
                {insights.commentary.map((comment, idx) => (
                  <div 
                    key={`comment-${idx}`} 
                    className="flex gap-2 items-start bg-primary/5 p-3 rounded-lg border border-primary/10"
                  >
                    <BrainCircuit className="h-4 w-4 mt-1 shrink-0 text-primary" />
                    <p className="text-sm text-foreground/90 leading-relaxed">
                      {comment}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Smart Tips Section */}
        {insights?.tips && insights.tips.length > 0 && (
          <Card className="col-span-full md:col-span-2 bg-gradient-to-br from-background to-muted">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-primary" />
                Smart Financial Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                {insights.tips.map((tip, index) => (
                  <div 
                    key={`tip-${index}`}
                    className="flex gap-3 items-start p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <AlertCircle className="h-5 w-5 mt-0.5 shrink-0 text-primary" />
                    <div className="space-y-1">
                      <p className="text-sm leading-relaxed">
                        {tip}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Key Metrics Card */}
        <Card className="bg-gradient-to-br from-background to-muted">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="h-5 w-5 text-primary" />
              Key Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {insights.stats && (
                <>
                  <div className="p-4 rounded-lg border bg-card">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Savings Rate</span>
                      <span className={cn(
                        "text-sm font-semibold",
                        insights.stats.savingsRate > 20 ? "text-green-500" : 
                        insights.stats.savingsRate > 10 ? "text-yellow-500" : 
                        "text-red-500"
                      )}>
                        {insights.stats.savingsRate.toFixed(1)}%
                      </span>
                    </div>
                    <Progress 
                      value={Math.min(insights.stats.savingsRate, 100)} 
                      className="h-2"
                    />
                  </div>
                  <div className="space-y-3">
                    <span className="text-sm font-medium">Top Expenses</span>
                    {insights.stats.topExpenses.map((expense, idx) => (
                      <div 
                        key={`expense-${idx}-${expense.name}`}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card"
                      >
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-primary" />
                          <span className="text-sm">{expense.name}</span>
                        </div>
                        <span className="text-sm font-medium">
                          ${expense.totalAmount.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Monthly Comparisons section */}
        <Card className="col-span-full bg-gradient-to-br from-background to-muted">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowUpDown className="h-5 w-5 text-primary" />
              Monthly Changes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <div className="grid grid-flow-col auto-cols-[minmax(200px,1fr)] gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-primary/10 scrollbar-track-transparent hover:scrollbar-thumb-primary/20">
                {insights?.monthOverMonth?.changes
                  ?.filter(change => Math.abs(change.percentageChange) > 0)
                  .sort((a, b) => Math.abs(b.percentageChange) - Math.abs(a.percentageChange))
                  .map((change, idx) => (
                    <div 
                      key={`change-${idx}-${change.category}`}
                      className="p-3 rounded-lg border bg-card h-full"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{change.category}</span>
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "text-sm font-semibold",
                            change.percentageChange > 0 ? "text-red-500" : "text-green-500"
                          )}>
                            {change.percentageChange > 0 ? '↑' : '↓'}
                            {Math.abs(change.percentageChange).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        ${change.previousAmount.toLocaleString()} → ${change.currentAmount.toLocaleString()}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Category Analysis */}
        <Card className="col-span-full bg-gradient-to-br from-background to-muted">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Boxes className="h-5 w-5 text-primary" />
              Spending Categories Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {insights?.categoryAnalysis?.map((category, idx) => (
                <div 
                  key={`category-${idx}-${category.name}`}
                  className="flex flex-col gap-2 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{category.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {category.percentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="relative pt-1">
                    <Progress value={category.percentage} className="h-2" />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      ${category.totalAmount.toLocaleString()}
                    </span>
                    {category.trend !== 0 && (
                      <span className={cn(
                        "text-xs",
                        category.trend > 0 ? "text-red-500" : "text-green-500"
                      )}>
                        {category.trend > 0 ? '↑' : '↓'} {Math.abs(category.trend).toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
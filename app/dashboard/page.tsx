"use client";
import { useEffect, useState, Suspense } from 'react';
import { DashboardSkeleton } from './skeleton';
import type { DashboardData } from '@/types/dashboard';
import { 
  LineChart, Line, PieChart, Pie,
  XAxis, YAxis, CartesianGrid, Tooltip, Cell,
  ResponsiveContainer, Area, AreaChart,
  Legend
} from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowDownIcon, 
  ArrowUpIcon, 
  ShoppingBagIcon, 
  HomeIcon, 
  CarIcon,
  UtensilsCrossedIcon,
  LightbulbIcon,
  Gamepad2Icon,
  BriefcaseIcon,
  AlertCircleIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  DollarSignIcon
} from "lucide-react";
import { EmptyDashboard } from './empty-state';
import { InsightsSection } from '@/components/insights';
import { cn } from "@/lib/utils";
import { motion } from 'framer-motion';
// Category icon mapping
const CATEGORY_ICONS = {
  'Housing': HomeIcon,
  'Food': UtensilsCrossedIcon,
  'Transport': CarIcon,
  'Utilities': LightbulbIcon,
  'Entertainment': Gamepad2Icon,
  'Salary': BriefcaseIcon,
} as const;

const chartConfig = {
  amount: {
    label: "Amount",
    theme: {
      light: "hsl(var(--primary))",
      dark: "hsl(var(--primary))"
    }
  },
  expense: {
    label: "Expense",
    theme: {
      light: "hsl(var(--destructive))",
      dark: "hsl(var(--destructive))"
    }
  },
  income: {
    label: "Income",
    theme: {
      light: "hsl(var(--success))",
      dark: "hsl(var(--success))"
    }
  }
};

// Enhanced Card component with optional icon and trend
const Card = ({ 
  title, 
  description, 
  value,
  trend,
  icon: Icon,
  children 
}: {
  title: string;
  description: string;
  value?: string;
  trend?: number;
  icon?: React.ElementType;
  children: React.ReactNode;
}) => (
  <div className="rounded-lg border bg-card p-6 shadow-sm h-full text-card-foreground dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="p-2 rounded-full bg-primary/10 text-primary dark:bg-primary/20">
            <Icon className="w-5 h-5" />
          </div>
        )}
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground dark:text-gray-400">{description}</p>
        </div>
      </div>
      {trend !== undefined && (
        <div className={`flex items-center ${
          trend > 0 ? 'text-success' : trend < 0 ? 'text-destructive' : 'text-muted-foreground'
        }`}>
          {trend > 0 ? <TrendingUpIcon className="w-4 h-4 mr-1" /> : 
           trend < 0 ? <TrendingDownIcon className="w-4 h-4 mr-1" /> : null}
          <span className="text-sm font-medium">{Math.abs(trend).toFixed(1)}%</span>
        </div>
      )}
    </div>
    {value && <div className="text-2xl font-bold mb-4">{value}</div>}
    {children}
  </div>
);

// Budget Progress component
const BudgetProgress = ({ spent, budget }: { spent: number; budget: number }) => {
  const progress = (spent / budget) * 100;
  const remaining = budget - spent;
  const isOverBudget = spent > budget;

  return (
    <div className="space-y-3">
      <Progress 
        value={Math.min(progress, 100)} 
        className={cn(
          isOverBudget 
            ? "bg-destructive/20 [&>div]:bg-destructive" 
            : "bg-success/20 [&>div]:bg-success"
        )}
      />
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">
          {isOverBudget ? 'Over budget by' : 'Remaining'}: 
          <span className={cn(
            "ml-1 font-medium",
            isOverBudget ? 'text-destructive' : 'text-success'
          )}>
            ${Math.abs(remaining).toLocaleString()}
          </span>
        </span>
        <span className={cn(
          "font-medium",
          isOverBudget ? 'text-destructive' : 'text-success'
        )}>
          {progress.toFixed(1)}% of budget
        </span>
      </div>
    </div>
  );
};

// Transaction row component
const TransactionRow = ({ transaction }: { 
  transaction: {
    id: string;
    name: string;
    amount: number;
    type: 'expense' | 'income'; 
    category: string;
    date: string;
  }
}) => {
  const CategoryIcon = CATEGORY_ICONS[transaction.category as keyof typeof CATEGORY_ICONS] || ShoppingBagIcon;
  const isIncome = transaction.type === 'income';
  
  return (
    <div className="flex items-center justify-between p-4 border-b last:border-0 border-muted dark:border-gray-800">
      <div className="flex items-center gap-4">
        <div className={`p-2 rounded-full ${
          isIncome
            ? 'bg-success/20 text-success dark:bg-success/20 dark:text-success'
            : 'bg-destructive/20 text-destructive dark:bg-destructive/20 dark:text-destructive'
        }`}>
          {isIncome ? <ArrowUpIcon className="w-4 h-4" /> : <ArrowDownIcon className="w-4 h-4" />}
        </div>
        <div className="flex items-center gap-3">
          <CategoryIcon className="w-4 h-4 text-muted-foreground dark:text-muted-foreground" />
          <div>
            <p className="font-medium text-foreground dark:text-foreground">{transaction.name}</p>
            <p className="text-sm text-muted-foreground dark:text-muted-foreground">{transaction.category}</p>
          </div>
        </div>
      </div>
      <div className="text-right">
        <p className={`font-medium ${
          isIncome
            ? 'text-success dark:text-success'
            : 'text-destructive dark:text-destructive'
        }`}>
          {isIncome ? '+' : '-'}${Math.abs(transaction.amount).toLocaleString()}
        </p>
        <p className="text-sm text-muted-foreground dark:text-muted-foreground">{transaction.date}</p>
      </div>
    </div>
  );
};

async function fetchDashboardData(): Promise<DashboardData> {
  const response = await fetch('/api/dashboard', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    next: { revalidate: 60 } // Cache for 60 seconds
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch dashboard data: ${response.statusText}`);
  }

  const data = await response.json();
  if ('error' in data) {
    throw new Error(data.error);
  }

  return data;
}

export default function BudgetDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchDashboardData();
        setDashboardData(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load dashboard data';
        setError(errorMessage);
        console.error('Dashboard loading error:', errorMessage);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-4">
        <div className="text-destructive mb-4">
          <AlertCircleIcon className="w-12 h-12" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Error Loading Dashboard</h2>
        <p className="text-muted-foreground text-center">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
        >
          Retry
        </button>
      </div>
    );
  }

  // Check if dashboard is empty
  const isDashboardEmpty = !dashboardData || (
    dashboardData.stats.totalSpent === 0 &&
    dashboardData.stats.totalIncome === 0 &&
    dashboardData.expenseCategories.length === 0 &&
    dashboardData.recentTransactions.length === 0
  );

  if (isDashboardEmpty) {
    return <EmptyDashboard />;
  }

  // Calculate savings rate
  const savingsRate = ((dashboardData.stats.totalIncome - dashboardData.stats.totalSpent) / 
    dashboardData.stats.totalIncome * 100) || 0;

  const statCards = [
    { 
      title: 'Total Spent', 
      value: `$${dashboardData?.stats.totalSpent.toLocaleString() || 0}`,
      change: dashboardData?.stats.changes.totalSpent || 0,
      icon: ShoppingBagIcon,
      description: 'Total expenses this month'
    },
    { 
      title: 'Monthly Income', 
      value: `$${dashboardData?.stats.totalIncome.toLocaleString() || 0}`,
      icon: BriefcaseIcon,
      description: 'Total income this month'
    },
    { 
      title: 'Savings Rate', 
      value: `${savingsRate.toFixed(1)}%`,
      icon: DollarSignIcon,
      description: 'Percentage of income saved'
    }
  ];

  const COLORS = {
    expense: "hsl(var(--destructive))",
    income: "hsl(var(--success))",
    primary: "hsl(var(--primary))",
    secondary: "hsl(var(--secondary))",
    muted: "hsl(var(--muted))"
  };

  return (
    <div className="min-h-screen w-full bg-background text-foreground dark:bg-gray-950 dark:text-gray-100">
      <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-6">
        <Suspense fallback={<DashboardSkeleton />}>
          {/* Budget Progress */}
          <Card
            title="Monthly Budget"
            description={`$${dashboardData?.stats.totalSpent.toLocaleString()} spent of $${dashboardData?.stats.monthlyBudget.toLocaleString()}`}
            icon={DollarSignIcon}
          >
            <BudgetProgress 
              spent={dashboardData?.stats.totalSpent || 0} 
              budget={dashboardData?.stats.monthlyBudget || 0} 
            />
          </Card>

          {/* Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {statCards.map((stat) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                className="col-span-1"
              >
                <Card
                  title={stat.title}
                  description={stat.description}
                  value={stat.value}
                  trend={stat.change}
                  icon={stat.icon}
                >
                  <div className="flex justify-between items-end">
                    {stat.children}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
    
          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Monthly Spending Trends */}
            <div className="col-span-full lg:col-span-8">
              <Card
                title="Monthly Spending Trends"
                description="Your spending patterns over the last 6 months"
                icon={TrendingUpIcon}
              >
                <div className="mt-6 aspect-[16/9] w-full">
                  <ChartContainer config={chartConfig}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart 
                        data={dashboardData?.monthlyTrends || []}
                        margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
                      >
                        <defs>
                          <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.8}/>
                            <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted/50" />
                        <XAxis 
                          dataKey="month" 
                          className="text-muted-foreground"
                          tick={{ fill: 'currentColor', fontSize: 12 }}
                          axisLine={false}
                          tickLine={false}
                          dy={10}
                        />
                        <YAxis 
                          className="text-muted-foreground"
                          tick={{ fill: 'currentColor', fontSize: 12 }}
                          tickFormatter={(value) => `$${value.toLocaleString()}`}
                          axisLine={false}
                          tickLine={false}
                          dx={-10}
                        />
                        <Tooltip 
                          content={<ChartTooltipContent 
                            formatter={(value) => `$${value.toLocaleString()}`}
                          />} 
                        />
                        <Area
                          type="monotone"
                          dataKey="amount"
                          stroke={COLORS.primary}
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorAmount)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>
              </Card>
            </div>
    
            {/* Expense Categories */}
            <div className="col-span-full lg:col-span-4">
              <Card
                title="Expense Categories"
                description="Distribution of your spending"
                icon={ShoppingBagIcon}
              >
                <div className="mt-6 relative aspect-square w-full max-h-[350px]">
                  <ChartContainer config={chartConfig}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart margin={{ top: 0, right: 0, bottom: 30, left: 0 }}>
                        <Pie
                          data={dashboardData?.expenseCategories || []}
                          cx="50%"
                          cy="50%"
                          innerRadius="55%"
                          outerRadius="80%"
                          paddingAngle={2}
                          dataKey="value"
                          nameKey="name"
                          label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                          labelLine={false}
                        >
                          {dashboardData?.expenseCategories.map((entry: any) => (
                            <Cell 
                              key={entry.name}
                              fill={COLORS[entry.name] || COLORS.default}
                            />
                          ))}
                        </Pie>
                        <Tooltip 
                          content={<ChartTooltipContent 
                            formatter={(value) => `$${value.toLocaleString()}`}
                          />} 
                        />
                        <Legend 
                          verticalAlign="bottom"
                          align="center"
                          layout="horizontal"
                          wrapperStyle={{
                            bottom: -20,
                            left: 0,
                            right: 0,
                            fontSize: '12px'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>
              </Card>
            </div>
    
            {/* Recent Transactions */}
            <div className="col-span-full">
              <Card
                title="Recent Transactions"
                description="Your latest financial activities"
                icon={DollarSignIcon}
              >
                <div className="mt-4 divide-y rounded-md border border-muted dark:border-gray-800 dark:divide-gray-800">
                  {dashboardData?.recentTransactions.map((transaction: any) => (
                    <TransactionRow 
                      key={transaction.id} 
                      transaction={transaction} 
                    />
                  ))}
                </div>
              </Card>
            </div>
          </div>

          {/* Add Insights Section */}
          <section>
            <InsightsSection />
          </section>
        </Suspense>
      </div>
    </div>
  );
}
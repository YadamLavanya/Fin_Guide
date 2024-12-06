"use client";
import { 
  LineChart, Line, PieChart, Pie,
  XAxis, YAxis, CartesianGrid, Tooltip, Cell 
} from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { 
  ArrowDownIcon, 
  ArrowUpIcon, 
  ShoppingBagIcon, 
  HomeIcon, 
  CarIcon,
  UtensilsCrossedIcon,
  LightbulbIcon,
  Gamepad2Icon,
  BriefcaseIcon
} from "lucide-react";

// Category icon mapping
const CATEGORY_ICONS = {
  'Housing': HomeIcon,
  'Food': UtensilsCrossedIcon,
  'Transport': CarIcon,
  'Utilities': LightbulbIcon,
  'Entertainment': Gamepad2Icon,
  'Salary': BriefcaseIcon,
} as const;

// Card component
const Card = ({ title, description, children }: {
  title: string;
  description: string;
  children: React.ReactNode;
}) => (
  <div className="rounded-lg border bg-card p-6 shadow-sm h-full text-card-foreground dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100">
    <h3 className="font-semibold">{title}</h3>
    <p className="text-sm text-muted-foreground mb-4 dark:text-gray-400">{description}</p>
    {children}
  </div>
);

// Transaction row component
const TransactionRow = ({ transaction }: { 
  transaction: {
    id: string;
    name: string;
    amount: number;
    type: string;
    category: string;
    date: string;
  }
}) => {
  const CategoryIcon = CATEGORY_ICONS[transaction.category as keyof typeof CATEGORY_ICONS] || ShoppingBagIcon;
  
  return (
    <div className="flex items-center justify-between p-4 border-b last:border-0 border-muted dark:border-gray-800">
      <div className="flex items-center gap-4">
        <div className={`p-2 rounded-full ${
          transaction.type === 'expense' 
            ? 'bg-destructive/20 text-destructive dark:bg-destructive/20 dark:text-destructive' 
            : 'bg-success/20 text-success dark:bg-success/20 dark:text-success'
        }`}>
          {transaction.type === 'expense' ? 
            <ArrowDownIcon className="w-4 h-4" /> : 
            <ArrowUpIcon className="w-4 h-4" />
          }
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
          transaction.type === 'expense' 
            ? 'text-destructive dark:text-destructive' 
            : 'text-success dark:text-success'
        }`}>
          {transaction.type === 'expense' ? '-' : '+'}
          ${Math.abs(transaction.amount).toLocaleString()}
        </p>
        <p className="text-sm text-muted-foreground dark:text-muted-foreground">{transaction.date}</p>
      </div>
    </div>
  );
};

export default function BudgetDashboard() {
  const monthlySpendingData = [
    { month: 'Jan', amount: 2100 },
    { month: 'Feb', amount: 1800 },
    { month: 'Mar', amount: 2300 },
    { month: 'Apr', amount: 1900 },
    { month: 'May', amount: 2500 },
    { month: 'Jun', amount: 2000 }
  ];

  const expenseCategoriesData = [
    { name: 'Housing', value: 1200 },
    { name: 'Food', value: 400 },
    { name: 'Transport', value: 300 },
    { name: 'Utilities', value: 200 },
    { name: 'Entertainment', value: 150 }
  ];

  const recentTransactions = [
    {
      id: '1',
      name: 'Rent Payment',
      amount: 1200,
      type: 'expense',
      category: 'Housing',
      date: '2024-03-01'
    },
    {
      id: '2',
      name: 'Salary Deposit',
      amount: 3000,
      type: 'income',
      category: 'Salary',
      date: '2024-03-01'
    },
    {
      id: '3',
      name: 'Grocery Shopping',
      amount: 85,
      type: 'expense',
      category: 'Food',
      date: '2024-03-02'
    }
  ];

  const COLORS = [
    'hsl(var(--chart-primary))',
    'hsl(var(--chart-secondary))',
    'hsl(var(--chart-success))',
    'hsl(var(--chart-warning))',
    'hsl(var(--chart-error))'
  ];

  const statCards = [
    { title: 'Total Spent', value: '$2,250', change: '+12.5%' },
    { title: 'Average Daily', value: '$75', change: '-2.3%' },
    { title: 'Monthly Budget', value: '$3,000', change: '0%' }
  ];

  return (
    <div className="min-h-screen w-full bg-background text-foreground dark:bg-gray-950 dark:text-gray-100">
      <div className="w-full h-full p-4 md:p-6 lg:p-8">        
        {/* Stats Row - Auto-fit grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 auto-rows-fr gap-4 md:gap-6 mb-6">
          {statCards.map((stat, index) => (
            <Card key={index} title={stat.title} description="">
              <div className="flex justify-between items-end">
                <span className="text-2xl font-bold">{stat.value}</span>
                <span className={`text-sm ${
                  stat.change.startsWith('+') ? 'text-chart-success dark:text-chart-success' : 
                  stat.change.startsWith('-') ? 'text-chart-error dark:text-chart-error' : 
                  'text-muted-foreground dark:text-muted-foreground'
                }`}>{stat.change}</span>
              </div>
            </Card>
          ))}
        </div>
  
        {/* Charts Grid - Responsive 12-column grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
          {/* Monthly Spending Trends */}
          <div className="col-span-full lg:col-span-8 min-h-[400px]">
            <Card
              title="Monthly Spending Trends"
              description=""
            >
              <div className="h-full w-full min-h-[300px]">
                <ChartContainer config={{}} className="w-full h-full">
                  <LineChart 
                    width={500}
                    height={300}
                    data={monthlySpendingData}
                    margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Line 
                      type="monotone" 
                      dataKey="amount" 
                      stroke="hsl(var(--chart-primary))"
                      strokeWidth={2} 
                    />
                  </LineChart>
                </ChartContainer>
              </div>
            </Card>
          </div>
  
          {/* Expense Categories */}
          <div className="col-span-full lg:col-span-4 min-h-[400px]">
            <Card
              title="Expense Categories"
              description=""
            >
              <div className="h-full w-full min-h-[300px]">
                <ChartContainer config={{}} className="w-full h-full">
                  <PieChart width={400} height={300}>
                    <Pie
                      data={expenseCategoriesData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {expenseCategoriesData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={COLORS[index % COLORS.length]} 
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ChartContainer>
              </div>
            </Card>
          </div>
  
          {/* Recent Transactions */}
          <div className="col-span-full">
            <Card
              title="Recent Transactions"
              description=""
            >
              <div className="divide-y rounded-md border border-muted dark:border-gray-800 dark:divide-gray-800">
                {recentTransactions.map((transaction) => (
                  <TransactionRow 
                    key={transaction.id} 
                    transaction={transaction} 
                  />
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
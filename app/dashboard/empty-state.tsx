import { Plus } from 'lucide-react';
import Link from 'next/link';

export function EmptyDashboard() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[600px] p-8">
      <div className="w-64 h-64 mb-8">
        {/* Fun SVG illustration */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full text-muted-foreground/20"
        >
          <path
            d="M12 2L2 7L12 12L22 7L12 2Z"
            className="stroke-current"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M2 17L12 22L22 17"
            className="stroke-current"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M2 12L12 17L22 12"
            className="stroke-current"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <h3 className="text-2xl font-semibold mb-2">No expenses yet!</h3>
      <p className="text-muted-foreground mb-8 text-center max-w-md">
        Start tracking your expenses to get insights into your spending habits.
        Your financial journey begins with the first entry!
      </p>
      <Link
        href="/dashboard/expenses"
        className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
      >
        <Plus className="w-5 h-5 mr-2" />
        Add Your First Expense
      </Link>
    </div>
  );
}

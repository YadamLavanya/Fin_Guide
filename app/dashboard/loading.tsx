import { DashboardSkeleton } from './skeleton';

// loading.tsx

export default function BudgetDashboardLoading() {
  return (
    <div className="min-h-screen w-full bg-background text-foreground dark:bg-gray-950 dark:text-gray-100">
      <div className="w-full h-full p-4 md:p-6 lg:p-8">
        <DashboardSkeleton />
      </div>
    </div>
  );
}
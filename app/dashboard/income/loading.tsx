// loading.tsx
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function IncomePageSkeleton() {
  return (
    <div className="min-h-screen w-full bg-background text-foreground dark:bg-gray-950 dark:text-gray-100">
      <div className="w-full h-full p-4 md:p-6 lg:p-8">
        <div className="rounded-lg border bg-card shadow-sm dark:border-gray-800 dark:bg-gray-900 h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="h-8 w-48 bg-muted animate-pulse rounded" />
            <div className="h-10 w-28 bg-muted animate-pulse rounded" />
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Search and Filter Controls */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="h-10 w-full sm:w-64 bg-muted animate-pulse rounded" />
              <div className="h-10 w-full sm:w-48 bg-muted animate-pulse rounded" />
            </div>

            {/* Date Filter */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="h-10 w-full sm:w-48 bg-muted animate-pulse rounded" />
              <div className="h-10 w-full sm:w-48 bg-muted animate-pulse rounded" />
            </div>

            {/* Table */}
            <div className="rounded-md border overflow-hidden">
              <div className="bg-muted/50">
                <div className="grid grid-cols-5 gap-4 p-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-4 bg-muted animate-pulse rounded" />
                  ))}
                </div>
              </div>
              <div className="divide-y">
                {[1, 2, 3, 4, 5].map((row) => (
                  <div key={row} className="grid grid-cols-5 gap-4 p-4">
                    {[1, 2, 3, 4, 5].map((col) => (
                      <div key={col} className="h-4 bg-muted animate-pulse rounded" />
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="h-6 w-48 bg-muted animate-pulse rounded" />
              <div className="h-10 w-28 bg-muted animate-pulse rounded" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default IncomePageSkeleton;
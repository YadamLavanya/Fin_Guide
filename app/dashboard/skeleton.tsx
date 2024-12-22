export function DashboardSkeleton() {
  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-6">
      {/* Budget Progress Skeleton */}
      <div className="rounded-lg border bg-card p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10 dark:bg-primary/20">
              <div className="w-5 h-5 bg-muted animate-pulse rounded" />
            </div>
            <div>
              <div className="h-5 w-24 bg-muted animate-pulse rounded" />
              <div className="h-4 w-48 mt-1 bg-muted animate-pulse rounded" />
            </div>
          </div>
        </div>
        <div className="space-y-3">
          <div className="h-2 w-full bg-muted animate-pulse rounded-full" />
          <div className="flex justify-between">
            <div className="h-4 w-24 bg-muted animate-pulse rounded" />
            <div className="h-4 w-16 bg-muted animate-pulse rounded" />
          </div>
        </div>
      </div>

      {/* Stats Row Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((index) => (
          <div key={index} className="rounded-lg border bg-card p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10 dark:bg-primary/20">
                  <div className="w-5 h-5 bg-muted animate-pulse rounded" />
                </div>
                <div>
                  <div className="h-5 w-24 bg-muted animate-pulse rounded" />
                  <div className="h-4 w-32 mt-1 bg-muted animate-pulse rounded" />
                </div>
              </div>
              <div className="h-4 w-16 bg-muted animate-pulse rounded" />
            </div>
            <div className="h-8 w-32 bg-muted animate-pulse rounded" />
          </div>
        ))}
      </div>

      {/* Charts Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Area Chart Skeleton */}
        <div className="col-span-full lg:col-span-8">
          <div className="rounded-lg border bg-card p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10 dark:bg-primary/20">
                  <div className="w-5 h-5 bg-muted animate-pulse rounded" />
                </div>
                <div>
                  <div className="h-5 w-36 bg-muted animate-pulse rounded" />
                  <div className="h-4 w-48 mt-1 bg-muted animate-pulse rounded" />
                </div>
              </div>
            </div>
            <div className="mt-6 aspect-[16/9] w-full bg-muted animate-pulse rounded-lg" />
          </div>
        </div>

        {/* Pie Chart Skeleton */}
        <div className="col-span-full lg:col-span-4">
          <div className="rounded-lg border bg-card p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10 dark:bg-primary/20">
                  <div className="w-5 h-5 bg-muted animate-pulse rounded" />
                </div>
                <div>
                  <div className="h-5 w-32 bg-muted animate-pulse rounded" />
                  <div className="h-4 w-40 mt-1 bg-muted animate-pulse rounded" />
                </div>
              </div>
            </div>
            <div className="mt-6 aspect-square w-full max-h-[350px] bg-muted animate-pulse rounded-lg" />
          </div>
        </div>

        {/* Recent Transactions Skeleton */}
        <div className="col-span-full">
          <div className="rounded-lg border bg-card p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10 dark:bg-primary/20">
                  <div className="w-5 h-5 bg-muted animate-pulse rounded" />
                </div>
                <div>
                  <div className="h-5 w-36 bg-muted animate-pulse rounded" />
                  <div className="h-4 w-48 mt-1 bg-muted animate-pulse rounded" />
                </div>
              </div>
            </div>
            <div className="mt-4 divide-y rounded-md border border-muted dark:border-gray-800">
              {[1, 2, 3].map((index) => (
                <div key={index} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-8 w-8 bg-muted animate-pulse rounded-full" />
                    <div className="space-y-2">
                      <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                      <div className="h-3 w-16 bg-muted animate-pulse rounded" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                    <div className="h-3 w-24 bg-muted animate-pulse rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
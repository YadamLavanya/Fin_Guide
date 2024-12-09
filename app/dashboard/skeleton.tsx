
export function DashboardSkeleton() {
  const statCardSkeletons = Array(3).fill(null);
  const transactionSkeletons = Array(3).fill(null);

  return (
    <>
      {/* Stats Row Loading */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 auto-rows-fr gap-4 md:gap-6 mb-6">
        {statCardSkeletons.map((_, index) => (
          <div key={index} className="rounded-lg border bg-card p-6 shadow-sm h-full dark:border-gray-800 dark:bg-gray-900">
            <div className="space-y-3">
              <div className="h-4 w-1/3 bg-muted animate-pulse rounded dark:bg-gray-800" />
              <div className="flex justify-between items-end">
                <div className="h-8 w-1/2 bg-muted animate-pulse rounded dark:bg-gray-800" />
                <div className="h-4 w-1/4 bg-muted animate-pulse rounded dark:bg-gray-800" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid Loading */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
        {/* Monthly Spending Chart Loading */}
        <div className="col-span-full lg:col-span-8 min-h-[400px]">
          <div className="rounded-lg border bg-card p-6 shadow-sm h-full dark:border-gray-800 dark:bg-gray-900">
            <div className="space-y-3">
              <div className="h-4 w-1/4 bg-muted animate-pulse rounded dark:bg-gray-800" />
              <div className="h-[300px] w-full bg-muted animate-pulse rounded dark:bg-gray-800" />
            </div>
          </div>
        </div>

        {/* Pie Chart Loading */}
        <div className="col-span-full lg:col-span-4 min-h-[400px]">
          <div className="rounded-lg border bg-card p-6 shadow-sm h-full dark:border-gray-800 dark:bg-gray-900">
            <div className="space-y-3">
              <div className="h-4 w-1/3 bg-muted animate-pulse rounded dark:bg-gray-800" />
              <div className="h-[300px] w-full bg-muted animate-pulse rounded dark:bg-gray-800" />
            </div>
          </div>
        </div>

        {/* Transactions Loading */}
        <div className="col-span-full">
          <div className="rounded-lg border bg-card p-6 shadow-sm h-full dark:border-gray-800 dark:bg-gray-900">
            <div className="space-y-3">
              <div className="h-4 w-1/4 bg-muted animate-pulse rounded dark:bg-gray-800 mb-4" />
              <div className="divide-y rounded-md border border-muted dark:border-gray-800">
                {transactionSkeletons.map((_, index) => (
                  <div key={index} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-8 w-8 rounded-full bg-muted animate-pulse dark:bg-gray-800" />
                      <div className="space-y-2">
                        <div className="h-4 w-24 bg-muted animate-pulse rounded dark:bg-gray-800" />
                        <div className="h-3 w-16 bg-muted animate-pulse rounded dark:bg-gray-800" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 w-16 bg-muted animate-pulse rounded dark:bg-gray-800" />
                      <div className="h-3 w-24 bg-muted animate-pulse rounded dark:bg-gray-800" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
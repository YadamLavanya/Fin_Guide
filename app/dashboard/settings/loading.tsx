// loading.tsx

export default function SettingsLoading() {
    return (
      <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-6">
        {/* Main Settings Card */}
        <div className="rounded-lg border bg-card p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="space-y-6">
            {/* Header Skeleton */}
            <div className="h-7 w-1/4 bg-muted animate-pulse rounded dark:bg-gray-800" />
            
            {/* Settings Items */}
            {Array(6).fill(null).map((_, index) => (
              <div key={index} className="flex items-center justify-between py-4 border-b last:border-0 dark:border-gray-800">
                <div className="space-y-1">
                  <div className="h-5 w-32 bg-muted animate-pulse rounded dark:bg-gray-800" />
                  <div className="h-4 w-48 bg-muted animate-pulse rounded dark:bg-gray-800 opacity-70" />
                </div>
                <div className="h-6 w-12 bg-muted animate-pulse rounded-full dark:bg-gray-800" />
              </div>
            ))}
          </div>
        </div>
  
        {/* Action Buttons Skeleton */}
        <div className="flex justify-end gap-4">
          <div className="h-10 w-24 bg-muted animate-pulse rounded dark:bg-gray-800" />
          <div className="h-10 w-24 bg-muted animate-pulse rounded dark:bg-gray-800" />
        </div>
      </div>
    );
  }
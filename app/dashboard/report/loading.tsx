export function ReportPageSkeleton() {
  return (
    <div className="min-h-screen w-full bg-background p-4 md:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Report Form Card */}
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="space-y-6">
            {/* Title */}
            <div className="h-8 w-48 bg-muted animate-pulse rounded" />

            {/* Form Fields */}
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                <div className="h-10 w-full bg-muted animate-pulse rounded" />
              </div>

              <div className="space-y-2">
                <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                <div className="h-10 w-full bg-muted animate-pulse rounded" />
              </div>

              <div className="space-y-2">
                <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                <div className="h-32 w-full bg-muted animate-pulse rounded" />
              </div>

              <div className="h-10 w-full bg-muted animate-pulse rounded" />
            </div>
          </div>
        </div>

        {/* Recent Reports Card */}
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="space-y-6">
            {/* Title */}
            <div className="h-8 w-48 bg-muted animate-pulse rounded" />

            {/* Reports List */}
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="border rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="h-5 w-48 bg-muted animate-pulse rounded" />
                    <div className="h-5 w-20 bg-muted animate-pulse rounded" />
                  </div>
                  <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
                  <div className="h-3 w-32 bg-muted animate-pulse rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReportPageSkeleton; 
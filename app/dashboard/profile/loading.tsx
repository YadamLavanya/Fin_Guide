"use client"

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent
} from "@/components/ui/card"

export function ProfilePageSkeleton() {
  return (
    <div className="min-h-screen w-full bg-background text-foreground dark:bg-gray-950 dark:text-gray-100">
      <div className="w-full h-full p-4 md:p-6 lg:p-8">
        <div className="rounded-lg border bg-card shadow-sm dark:border-gray-800 dark:bg-gray-900">
          {/* Header */}
          <div className="p-6 border-b">
            <div className="h-8 w-32 bg-muted animate-pulse rounded" />
          </div>

          {/* Content */}
          <div className="p-6 space-y-8">
            {/* Profile Header */}
            <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6">
              {/* Avatar */}
              <div className="relative">
                <div className="h-24 w-24 rounded-full bg-muted animate-pulse" />
                <div className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-muted animate-pulse" />
              </div>

              {/* Profile Info */}
              <div className="flex-1 w-full sm:w-auto text-center sm:text-left">
                <div className="h-8 w-48 bg-muted animate-pulse rounded mb-2" />
                <div className="h-4 w-32 bg-muted animate-pulse rounded mb-4" />

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="rounded-lg border p-3">
                      <div className="h-4 w-24 bg-muted animate-pulse rounded mb-2" />
                      <div className="h-6 w-16 bg-muted animate-pulse rounded" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Personal Information */}
            <div className="space-y-4">
              <div className="h-6 w-48 bg-muted animate-pulse rounded mb-4" />
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                    <div className="h-10 w-full bg-muted animate-pulse rounded" />
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="flex flex-col sm:flex-row justify-end gap-4 pt-4">
              <div className="h-10 w-full sm:w-24 bg-muted animate-pulse rounded" />
              <div className="h-10 w-full sm:w-32 bg-muted animate-pulse rounded" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePageSkeleton;
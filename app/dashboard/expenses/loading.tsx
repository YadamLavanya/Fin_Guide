// loading.tsx
import { Card, CardContent, CardHeader } from "@/components/ui/card";
export default function ExpensesLoading() {
    return (
      <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-6">
        {/* New Expense Form Skeleton */}
        <Card className="w-full">
          <CardHeader>
            <div className="h-6 w-1/4 bg-muted animate-pulse rounded dark:bg-gray-800" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Amount Input Skeleton */}
              <div className="space-y-2">
                <div className="h-4 w-16 bg-muted animate-pulse rounded dark:bg-gray-800" />
                <div className="h-10 w-full bg-muted animate-pulse rounded dark:bg-gray-800" />
              </div>
              
              {/* Category Select Skeleton */}
              <div className="space-y-2">
                <div className="h-4 w-20 bg-muted animate-pulse rounded dark:bg-gray-800" />
                <div className="h-10 w-full bg-muted animate-pulse rounded dark:bg-gray-800" />
              </div>
              
              {/* Description Input Skeleton */}
              <div className="space-y-2">
                <div className="h-4 w-24 bg-muted animate-pulse rounded dark:bg-gray-800" />
                <div className="h-10 w-full bg-muted animate-pulse rounded dark:bg-gray-800" />
              </div>
            </div>
            
            {/* Submit Button Skeleton */}
            <div className="flex justify-end">
              <div className="h-10 w-24 bg-muted animate-pulse rounded dark:bg-gray-800" />
            </div>
          </CardContent>
        </Card>
  
        {/* Expenses List Skeleton */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="h-6 w-1/4 bg-muted animate-pulse rounded dark:bg-gray-800" />
            <div className="h-9 w-32 bg-muted animate-pulse rounded dark:bg-gray-800" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array(5).fill(null).map((_, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-4 border rounded-lg dark:border-gray-800"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-muted animate-pulse rounded-full dark:bg-gray-800" />
                    <div className="space-y-2">
                      <div className="h-4 w-32 bg-muted animate-pulse rounded dark:bg-gray-800" />
                      <div className="h-3 w-24 bg-muted animate-pulse rounded dark:bg-gray-800" />
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="h-5 w-20 bg-muted animate-pulse rounded dark:bg-gray-800" />
                    <div className="h-8 w-8 bg-muted animate-pulse rounded dark:bg-gray-800" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
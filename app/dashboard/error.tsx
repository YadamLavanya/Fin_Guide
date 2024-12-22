'use client';

import { useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to an error reporting service
    const errorMessage = error.message || 'An unexpected error occurred';
    const errorDigest = error.digest || 'No digest available';
    
    // Using a more structured logging approach
    console.error({
      type: 'Dashboard Error',
      message: errorMessage,
      digest: errorDigest,
      timestamp: new Date().toISOString(),
    });
  }, [error]);

  return (
    <div className="min-h-screen w-full bg-background p-4 md:p-6 lg:p-8 flex items-center justify-center">
      <Card className="w-full max-w-md p-6">
        <div className="flex flex-col items-center text-center">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Something went wrong!</h2>
          <p className="text-muted-foreground mb-6">
            {error.message || 'We encountered an error while loading your dashboard. Please try again.'}
          </p>
          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </Button>
            <Button
              onClick={() => reset()}
            >
              Try Again
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

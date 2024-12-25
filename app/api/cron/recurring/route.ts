import { NextRequest, NextResponse } from 'next/server';
import { processAllRecurringTransactions } from '@/utils/recurring';
import * as Sentry from '@sentry/node';

// Initialize Sentry
Sentry.init({
  dsn: process.env.SENTRY_DSN, // Make sure to set your Sentry DSN in the environment variables
  tracesSampleRate: 1.0, // Adjust this value as needed
});

// This header is used to verify that the request is coming from a cron job
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: NextRequest) {
  try {
    // Verify the request is from an authorized source
    const authHeader = request.headers.get('authorization');
    if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await processAllRecurringTransactions();
    return NextResponse.json(
      { message: 'Recurring transactions processed successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Failed to process recurring transactions:', error);
    Sentry.captureException(error); // Capture the error with Sentry
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Disable body parsing since we don't need it for this endpoint
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Maximum allowed duration on Vercel Hobby plan 
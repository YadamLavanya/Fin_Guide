import { NextRequest, NextResponse } from 'next/server';
import { processAllRecurringTransactions } from '@/utils/recurring';

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
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Disable body parsing since we don't need it for this endpoint
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Maximum allowed duration on Vercel Hobby plan 
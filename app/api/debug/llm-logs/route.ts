import { NextResponse } from 'next/server';
import { llmLogger } from '@/lib/llm/logging';

export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  return NextResponse.json({
    logs: llmLogger.getLogs()
  });
}

export async function DELETE() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  llmLogger.clearLogs();
  return NextResponse.json({ message: 'Logs cleared' });
}

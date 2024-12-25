import { RecurringType } from '@prisma/client';

export function calculateNextProcessDate(
  currentDate: Date,
  recurringType: RecurringType,
  frequency: number,
  dayOfMonth?: number | null,
  dayOfWeek?: number | null,
  monthOfYear?: number | null
): Date {
  const nextDate = new Date(currentDate);

  switch (recurringType) {
    case 'DAILY':
      nextDate.setDate(nextDate.getDate() + frequency);
      break;

    case 'WEEKLY':
      if (dayOfWeek !== null && dayOfWeek !== undefined) {
        // First, move to the next occurrence of the specified day of week
        while (nextDate.getDay() !== dayOfWeek) {
          nextDate.setDate(nextDate.getDate() + 1);
        }
        // Then add the specified number of weeks
        nextDate.setDate(nextDate.getDate() + (7 * (frequency - 1)));
      } else {
        nextDate.setDate(nextDate.getDate() + (7 * frequency));
      }
      break;

    case 'MONTHLY':
      if (dayOfMonth !== null && dayOfMonth !== undefined) {
        // Move to the specified day of the next month
        nextDate.setMonth(nextDate.getMonth() + frequency);
        nextDate.setDate(Math.min(dayOfMonth, getDaysInMonth(nextDate.getFullYear(), nextDate.getMonth())));
      } else {
        nextDate.setMonth(nextDate.getMonth() + frequency);
      }
      break;

    case 'YEARLY':
      if (monthOfYear !== null && monthOfYear !== undefined && dayOfMonth !== null && dayOfMonth !== undefined) {
        nextDate.setFullYear(nextDate.getFullYear() + frequency);
        nextDate.setMonth(monthOfYear - 1); // monthOfYear is 1-based
        nextDate.setDate(Math.min(dayOfMonth, getDaysInMonth(nextDate.getFullYear(), monthOfYear - 1)));
      } else {
        nextDate.setFullYear(nextDate.getFullYear() + frequency);
      }
      break;
  }

  return nextDate;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function isDateInRange(date: Date, startDate: Date, endDate?: Date | null): boolean {
  if (!endDate) return date >= startDate;
  return date >= startDate && date <= endDate;
}

export function shouldProcessRecurring(
  nextProcessDate: Date,
  endDate?: Date | null
): boolean {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  // If there's an end date and we're past it, don't process
  if (endDate && today > endDate) return false;
  
  // Check if we've reached or passed the next process date
  return nextProcessDate <= today;
} 
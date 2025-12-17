import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  format,
} from "date-fns";

export type DateRangePreset = "today" | "week" | "month" | "custom";

export type DateRange = [Date, Date];

/**
 * Get date range for today (00:00:00 to 23:59:59)
 */
export function getTodayRange(): DateRange {
  const now = new Date();
  return [startOfDay(now), endOfDay(now)];
}

/**
 * Get date range for current week (Monday to Sunday)
 */
export function getWeekRange(): DateRange {
  const now = new Date();
  return [
    startOfWeek(now, { weekStartsOn: 1 }),
    endOfWeek(now, { weekStartsOn: 1 }),
  ];
}

/**
 * Get date range for current month (1st to last day)
 */
export function getMonthRange(): DateRange {
  const now = new Date();
  return [startOfMonth(now), endOfMonth(now)];
}

/**
 * Format date range for display
 */
export function formatDateRangeLabel(range: DateRange): string {
  const [start, end] = range;
  const startStr = format(start, "dd/MM/yyyy");
  const endStr = format(end, "dd/MM/yyyy");
  return `${startStr} - ${endStr}`;
}

import { startOfWeek, endOfWeek, format } from "date-fns";
import { es } from "date-fns/locale";

/**
 * Gets the start and end dates of the week containing the given date.
 * Week starts on Monday (weekStartsOn: 1).
 *
 * @param date - The date to get the week range for
 * @returns A tuple of [startDate, endDate] representing the week range
 *
 * @example
 * const date = new Date("2024-12-18"); // Wednesday
 * const [start, end] = getWeekRange(date);
 * // start: Monday Dec 16, 2024
 * // end: Sunday Dec 22, 2024
 */
export function getWeekRange(date: Date): [Date, Date] {
  const start = startOfWeek(date, { weekStartsOn: 1 }); // Monday
  const end = endOfWeek(date, { weekStartsOn: 1 }); // Sunday
  return [start, end];
}

/**
 * Formats a date in Spanish locale with the given format string.
 *
 * @param date - The date to format
 * @param formatStr - The format string (date-fns format)
 * @returns Formatted date string in Spanish
 *
 * @example
 * formatDateSpanish(new Date("2024-12-18"), "EEEE") // "miércoles"
 * formatDateSpanish(new Date("2024-12-18"), "MMM d") // "dic 18"
 */
export function formatDateSpanish(date: Date, formatStr: string): string {
  return format(date, formatStr, { locale: es });
}

/**
 * Formats a date range in Spanish locale.
 * Used for calendar header display.
 *
 * @param startDate - The start date of the range
 * @param endDate - The end date of the range
 * @returns Formatted date range string (e.g., "dic 16 - dic 22, 2024")
 *
 * @example
 * const [start, end] = getWeekRange(new Date("2024-12-18"));
 * formatDateRange(start, end) // "dic 16 - dic 22, 2024"
 */
export function formatDateRange(startDate: Date, endDate: Date): string {
  const startFormatted = formatDateSpanish(startDate, "MMM d");
  const endFormatted = formatDateSpanish(endDate, "MMM d, yyyy");
  return `${startFormatted} - ${endFormatted}`;
}

/**
 * Formats a date as day name in uppercase Spanish.
 * Used for day column headers.
 *
 * @param date - The date to format
 * @returns Uppercase day name in Spanish (e.g., "LUNES", "MARTES")
 *
 * @example
 * formatDayName(new Date("2024-12-18")) // "MIÉRCOLES"
 */
export function formatDayName(date: Date): string {
  return formatDateSpanish(date, "EEEE").toUpperCase();
}

/**
 * Formats a date as short date in Spanish.
 * Used for day column date display.
 *
 * @param date - The date to format
 * @returns Short date string (e.g., "dic 18")
 *
 * @example
 * formatShortDate(new Date("2024-12-18")) // "dic 18"
 */
export function formatShortDate(date: Date): string {
  return formatDateSpanish(date, "MMM d");
}

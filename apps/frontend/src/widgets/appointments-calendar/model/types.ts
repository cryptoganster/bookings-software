/**
 * Calendar Widget Types
 *
 * Defines types for the appointments calendar widget including
 * view modes, week ranges, day appointments grouping, and filters.
 */

import type { AppointmentReadModel } from "@entities/appointment";

/**
 * Calendar view mode
 * Currently only week view is supported
 */
export type ViewMode = "week";

/**
 * Week range represented as a tuple of start and end dates
 * Start date is the first day of the week (Monday)
 * End date is the last day of the week (Sunday)
 */
export type WeekRange = [Date, Date];

/**
 * Appointments grouped by day
 * Key is the date in yyyy-MM-dd format
 * Value is an array of appointments for that day
 *
 * @example
 * {
 *   "2024-12-18": [appointment1, appointment2],
 *   "2024-12-19": [appointment3]
 * }
 */
export type DayAppointments = Record<string, AppointmentReadModel[]>;

/**
 * Calendar filters for appointments
 * Extends the base appointment filters with calendar-specific options
 */
export interface CalendarFilters {
  /** Filter by appointment status */
  status?: "CONFIRMED" | "CANCELLED" | "COMPLETED";
  /** Filter by offering/service ID */
  offeringId?: string | null;
  /** Date range for filtering appointments */
  dateRange?: [Date, Date] | null;
}

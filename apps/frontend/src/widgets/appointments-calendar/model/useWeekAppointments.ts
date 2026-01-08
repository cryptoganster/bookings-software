import { useMemo } from "react";
import { format } from "date-fns";
import {
  useAppointments,
  type AppointmentFilters,
} from "@entities/appointment";
import type { DayAppointments, WeekRange } from "./types";

/**
 * Hook for fetching and grouping appointments by day for a given week.
 *
 * Uses the existing useAppointments hook from @entities/appointment
 * and groups the results by day using yyyy-MM-dd format.
 *
 * @param weekRange - Tuple of [startDate, endDate] for the week
 * @param filters - Optional filters to apply (status, offeringId, etc.)
 * @returns Query result with appointments grouped by day
 *
 * @example
 * const { data, isLoading, error, appointmentsByDay } = useWeekAppointments(currentWeek);
 *
 * // With filters
 * const { data, appointmentsByDay } = useWeekAppointments(currentWeek, {
 *   status: 'CONFIRMED',
 *   offeringId: 'offering-123'
 * });
 *
 * // Access appointments for a specific day
 * const mondayAppointments = appointmentsByDay["2024-12-18"];
 */
export function useWeekAppointments(
  weekRange: WeekRange,
  filters?: AppointmentFilters,
) {
  const [startDate, endDate] = weekRange;

  // Merge week range with additional filters
  const mergedFilters = useMemo<AppointmentFilters>(() => {
    return {
      dateRange: [startDate, endDate],
      ...filters,
    };
  }, [startDate, endDate, filters]);

  // Fetch appointments for the week using existing hook
  const query = useAppointments(mergedFilters);

  // Group appointments by day (yyyy-MM-dd format)
  const appointmentsByDay = useMemo<DayAppointments>(() => {
    if (!query.data) {
      return {};
    }

    return query.data.reduce<DayAppointments>((acc, appointment) => {
      // Parse the ISO 8601 dateTime string to Date object
      const appointmentDate = new Date(appointment.dateTime);
      // Format as yyyy-MM-dd for grouping
      const dayKey = format(appointmentDate, "yyyy-MM-dd");

      if (!acc[dayKey]) {
        acc[dayKey] = [];
      }

      acc[dayKey].push(appointment);

      return acc;
    }, {});
  }, [query.data]);

  return {
    ...query,
    appointmentsByDay,
  };
}

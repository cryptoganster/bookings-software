import { Paper, Stack } from "@mantine/core";
import { useMemo } from "react";
import { useCalendarNavigation } from "../model/useCalendarNavigation";
import { useWeekAppointments } from "../model/useWeekAppointments";
import { useAppointmentFilters } from "@features/appointment/filter";
import { CalendarHeader } from "./CalendarHeader";
import { WeekView } from "./WeekView";
import type { AppointmentFilters } from "@entities/appointment";

/**
 * AppointmentsCalendar Widget
 *
 * Main calendar widget that integrates navigation, filters, and week view.
 * Displays appointments in a weekly calendar format with filtering capabilities.
 *
 * Features:
 * - Week navigation (previous, next, today)
 * - Filter integration (status, offering)
 * - Date range override (uses current week instead of filter date range)
 * - Appointment count display
 * - Responsive layout
 *
 * @example
 * <AppointmentsCalendar />
 */
export function AppointmentsCalendar() {
  // Calendar navigation state
  const { currentWeek, goToPreviousWeek, goToNextWeek, goToToday } =
    useCalendarNavigation();

  // Get filters from Zustand store
  const { status, offeringId } = useAppointmentFilters();

  // Merge filters: override dateRange with currentWeek
  const additionalFilters = useMemo<
    Omit<AppointmentFilters, "dateRange"> | undefined
  >(() => {
    const filters: Omit<AppointmentFilters, "dateRange"> = {};

    if (status) {
      filters.status = status;
    }

    if (offeringId) {
      filters.offeringId = offeringId;
    }

    return Object.keys(filters).length > 0 ? filters : undefined;
  }, [status, offeringId]);

  // Fetch appointments for the week with merged filters
  const { data, isLoading, error, appointmentsByDay } = useWeekAppointments(
    currentWeek,
    additionalFilters,
  );

  // Calculate total appointment count for the week
  const appointmentCount = data?.length ?? 0;

  return (
    <Paper shadow="sm" p="md" withBorder>
      <Stack gap="md">
        <CalendarHeader
          weekRange={currentWeek}
          appointmentCount={appointmentCount}
          onPrevious={goToPreviousWeek}
          onNext={goToNextWeek}
          onToday={goToToday}
        />
        <WeekView
          weekRange={currentWeek}
          isLoading={isLoading}
          error={error ?? null}
          appointmentsByDay={appointmentsByDay}
        />
      </Stack>
    </Paper>
  );
}

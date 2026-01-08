import { SimpleGrid, LoadingOverlay, Alert } from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import { eachDayOfInterval, format } from "date-fns";
import { DayColumn } from "./DayColumn";
import type { WeekRange, DayAppointments } from "../model/types";

interface WeekViewProps {
  /** Week range as [startDate, endDate] */
  weekRange: WeekRange;
  /** Appointments grouped by day (yyyy-MM-dd format) */
  appointmentsByDay: DayAppointments;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: Error | null;
}

/**
 * WeekView Component
 *
 * Displays a week of appointments in a responsive grid layout.
 * Each day is rendered as a DayColumn component.
 *
 * Responsive columns:
 * - Desktop (lg): 7 columns (full week)
 * - Tablet (md): 5 columns
 * - Small tablet (sm): 3 columns
 * - Mobile (base): 1 column
 *
 * @example
 * <WeekView
 *   weekRange={[startDate, endDate]}
 *   appointmentsByDay={appointmentsByDay}
 *   isLoading={false}
 *   error={null}
 * />
 */
export function WeekView({
  weekRange,
  appointmentsByDay,
  isLoading,
  error,
}: WeekViewProps) {
  const [startDate, endDate] = weekRange;

  // Get all days in the week
  const daysInWeek = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  // Loading state
  if (isLoading) {
    return <LoadingOverlay visible />;
  }

  // Error state
  if (error) {
    return (
      <Alert
        icon={<IconAlertCircle size={16} />}
        title="Error al cargar citas"
        color="red"
      >
        {error instanceof Error
          ? error.message
          : "Ocurrió un error al cargar las citas"}
      </Alert>
    );
  }

  return (
    <SimpleGrid
      cols={{ base: 1, sm: 3, md: 5, lg: 7 }}
      spacing="md"
      style={{ alignItems: "stretch" }}
    >
      {daysInWeek.map((day) => {
        // Format day as yyyy-MM-dd to match appointmentsByDay keys
        const dayKey = format(day, "yyyy-MM-dd");
        const dayAppointments = appointmentsByDay[dayKey] || [];

        return (
          <DayColumn key={dayKey} date={day} appointments={dayAppointments} />
        );
      })}
    </SimpleGrid>
  );
}

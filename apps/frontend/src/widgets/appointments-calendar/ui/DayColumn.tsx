import { memo } from "react";
import { Stack, Text, Paper } from "@mantine/core";
import { format, isToday } from "date-fns";
import { es } from "date-fns/locale";
import { EmptyState } from "@shared/ui/EmptyState/EmptyState";
import { IconCalendarOff } from "@tabler/icons-react";
import type { AppointmentReadModel } from "@entities/appointment";
import { AppointmentSlot } from "./AppointmentSlot";

interface DayColumnProps {
  /** Date for this column */
  date: Date;
  /** Appointments for this day, sorted chronologically */
  appointments: AppointmentReadModel[];
  /** Loading state for appointments */
  isLoading?: boolean;
}

/**
 * DayColumn Component
 *
 * Displays a single day column in the week view with:
 * - Day name (uppercase, Spanish)
 * - Date (Spanish format)
 * - List of appointments sorted chronologically
 * - Current day highlighting (blue border and background)
 * - Empty state when no appointments
 * - Loading state when fetching appointments
 *
 * Memoized to prevent unnecessary re-renders when props haven't changed.
 *
 * @example
 * <DayColumn date={new Date()} appointments={[...]} isLoading={false} />
 */
const DayColumnComponent = ({
  date,
  appointments,
  isLoading = false,
}: DayColumnProps) => {
  const isCurrentDay = isToday(date);

  // Sort appointments chronologically by dateTime, then by id for deterministic ordering
  const sortedAppointments = [...appointments].sort((a, b) => {
    const timeDiff =
      new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime();
    // If times are equal, sort by id to ensure deterministic ordering
    return timeDiff !== 0 ? timeDiff : a.id.localeCompare(b.id);
  });

  // Format day name (uppercase) and date
  const dayName = format(date, "EEEE", { locale: es }).toUpperCase();
  const dateFormatted = format(date, "d 'de' MMMM", { locale: es });

  return (
    <Paper
      shadow="xs"
      p="md"
      withBorder
      style={{
        borderColor: isCurrentDay ? "var(--mantine-color-blue-6)" : undefined,
        borderWidth: isCurrentDay ? 2 : 1,
        backgroundColor: isCurrentDay
          ? "var(--mantine-color-blue-0)"
          : undefined,
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Stack gap="xs" style={{ flex: 1 }}>
        {/* Day header */}
        <Stack gap={4}>
          <Text
            size="sm"
            fw={700}
            c={isCurrentDay ? "blue.7" : "dimmed"}
            style={{ letterSpacing: "0.5px" }}
          >
            {dayName}
          </Text>
          <Text size="xs" c={isCurrentDay ? "blue.6" : "dimmed"}>
            {dateFormatted}
          </Text>
        </Stack>

        {/* Appointments list, loading state, or empty state */}
        {isLoading ? (
          <Text size="sm" c="dimmed" ta="center" mt="md">
            Cargando...
          </Text>
        ) : sortedAppointments.length === 0 ? (
          <EmptyState
            title="Sin citas"
            message="No hay citas programadas para este día"
            icon={<IconCalendarOff size={48} stroke={1.5} color="gray" />}
            size="sm"
          />
        ) : (
          <Stack gap="xs" mt="sm">
            {sortedAppointments.map((appointment) => (
              <AppointmentSlot key={appointment.id} appointment={appointment} />
            ))}
          </Stack>
        )}
      </Stack>
    </Paper>
  );
};

// Memoize component to prevent re-renders when props haven't changed
export const DayColumn = memo(DayColumnComponent);

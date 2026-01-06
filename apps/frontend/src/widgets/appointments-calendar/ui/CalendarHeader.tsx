import { Group, Text, Button, Badge } from "@mantine/core";
import {
  IconChevronLeft,
  IconChevronRight,
  IconCalendarEvent,
} from "@tabler/icons-react";
import { formatDateRange } from "../lib/dateUtils";

interface CalendarHeaderProps {
  weekRange: [Date, Date];
  appointmentCount: number;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
}

/**
 * Calendar header component displaying date range, appointment count, and navigation buttons.
 *
 * @param weekRange - Tuple of [startDate, endDate] for the current week
 * @param appointmentCount - Number of appointments in the current week
 * @param onPrevious - Callback for navigating to previous week
 * @param onNext - Callback for navigating to next week
 * @param onToday - Callback for navigating to current week
 *
 * @example
 * <CalendarHeader
 *   weekRange={[startDate, endDate]}
 *   appointmentCount={5}
 *   onPrevious={() => console.log('Previous')}
 *   onNext={() => console.log('Next')}
 *   onToday={() => console.log('Today')}
 * />
 */
export function CalendarHeader({
  weekRange,
  appointmentCount,
  onPrevious,
  onNext,
  onToday,
}: CalendarHeaderProps) {
  const [startDate, endDate] = weekRange;
  const dateRangeText = formatDateRange(startDate, endDate);

  return (
    <Group justify="space-between">
      <Group>
        <Text size="lg" fw={600}>
          {dateRangeText}
        </Text>
        <Badge color="blue" variant="light">
          {appointmentCount} citas
        </Badge>
      </Group>

      <Group gap="xs">
        <Button
          variant="default"
          size="sm"
          leftSection={<IconChevronLeft size={16} />}
          onClick={onPrevious}
        >
          Anterior
        </Button>
        <Button
          variant="default"
          size="sm"
          leftSection={<IconCalendarEvent size={16} />}
          onClick={onToday}
        >
          Hoy
        </Button>
        <Button
          variant="default"
          size="sm"
          rightSection={<IconChevronRight size={16} />}
          onClick={onNext}
        >
          Siguiente
        </Button>
      </Group>
    </Group>
  );
}

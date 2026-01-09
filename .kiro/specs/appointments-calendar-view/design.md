# Appointments Calendar View - Design

## Overview

This document describes the technical design for implementing a full calendar view for appointments in the frontend application. The calendar will provide business owners with a visual, time-based representation of their appointments, complementing the existing list view.

The design follows Feature-Sliced Design (FSD) architecture, integrates with existing appointment entities and features, and uses Mantine UI components for consistency.

## Architecture

### High-Level Component Structure

```
AppointmentsPage (pages/)
├── PageHeader
├── AppointmentFilters (features/appointment/filter)
├── ViewToggle (features/appointment/view-toggle) ← NEW
└── Conditional Rendering:
    ├── AppointmentsList (existing)
    └── AppointmentsCalendar (widgets/appointments-calendar) ← NEW
        ├── CalendarHeader (ui/)
        │   ├── DateRangeDisplay
        │   ├── NavigationButtons (Previous/Today/Next)
        │   └── AppointmentCount
        ├── WeekView (ui/)
        │   └── DayColumn (ui/) × 7
        │       ├── DayHeader (day name + date)
        │       └── AppointmentSlot (entities/appointment) × N
        │           └── AppointmentCard (existing, adapted)
        └── AppointmentDetailsModal (features/appointment/details) ← NEW
```

### FSD Layer Distribution

```
src/
├── app/
│   └── providers/
│       └── ViewPreferenceProvider.tsx ← NEW (localStorage context)
├── pages/
│   └── AppointmentsPage/
│       └── ui/
│           ├── AppointmentsPage.tsx ← MODIFIED (add toggle + conditional)
│           └── AppointmentsList.tsx (existing)
├── widgets/
│   └── appointments-calendar/ ← NEW
│       ├── ui/
│       │   ├── AppointmentsCalendar.tsx
│       │   ├── CalendarHeader.tsx
│       │   ├── WeekView.tsx
│       │   ├── DayColumn.tsx
│       │   └── AppointmentSlot.tsx
│       ├── model/
│       │   ├── useCalendarNavigation.ts
│       │   ├── useWeekAppointments.ts
│       │   └── types.ts
│       └── lib/
│           ├── dateUtils.ts
│           └── appointmentLayout.ts
├── features/
│   └── appointment/
│       ├── view-toggle/ ← NEW
│       │   ├── ui/
│       │   │   └── ViewToggle.tsx
│       │   └── model/
│       │       └── useViewPreference.ts
│       └── details/ ← NEW
│           ├── ui/
│           │   └── AppointmentDetailsModal.tsx
│           └── model/
│               └── useAppointmentDetails.ts
└── entities/
    └── appointment/
        ├── ui/
        │   ├── AppointmentCard.tsx (existing, adapt for calendar)
        │   └── AppointmentBadge.tsx (existing)
        └── model/
            └── queries.ts (existing, add week query)
```

## Components and Interfaces

### 1. ViewToggle (Feature)

**Location:** `src/features/appointment/view-toggle/`

**Purpose:** Toggle between list and calendar views with persistence

```typescript
// ui/ViewToggle.tsx
import { SegmentedControl } from "@mantine/core";
import { IconList, IconCalendar } from "@tabler/icons-react";
import { useViewPreference } from "../model/useViewPreference";

export function ViewToggle() {
  const { view, setView } = useViewPreference();

  return (
    <SegmentedControl
      value={view}
      onChange={(value) => setView(value as "list" | "calendar")}
      data={[
        {
          value: "list",
          label: (
            <Center>
              <IconList size={16} />
              <Box ml={10}>Lista</Box>
            </Center>
          ),
        },
        {
          value: "calendar",
          label: (
            <Center>
              <IconCalendar size={16} />
              <Box ml={10}>Calendario</Box>
            </Center>
          ),
        },
      ]}
    />
  );
}

// model/useViewPreference.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ViewPreferenceState {
  view: "list" | "calendar";
  setView: (view: "list" | "calendar") => void;
}

export const useViewPreference = create<ViewPreferenceState>()(
  persist(
    (set) => ({
      view: "list",
      setView: (view) => set({ view }),
    }),
    {
      name: "appointments-view-preference",
    }
  )
);
```

### 2. AppointmentsCalendar (Widget)

**Location:** `src/widgets/appointments-calendar/`

**Purpose:** Main calendar container with header and week view

```typescript
// ui/AppointmentsCalendar.tsx
import { Stack, Paper } from "@mantine/core";
import { CalendarHeader } from "./CalendarHeader";
import { WeekView } from "./WeekView";
import { useCalendarNavigation } from "../model/useCalendarNavigation";
import { useWeekAppointments } from "../model/useWeekAppointments";
import { useAppointmentFilters } from "@features/appointment/filter";

export function AppointmentsCalendar() {
  const { currentWeek, goToPreviousWeek, goToNextWeek, goToToday } =
    useCalendarNavigation();
  const { status, dateRange, offeringId } = useAppointmentFilters();

  const filters = {
    status: status || undefined,
    dateRange: currentWeek, // Override with current week
    offeringId: offeringId || undefined,
  };

  const { data: appointments, isLoading, isError } = useWeekAppointments(filters);

  return (
    <Paper shadow="sm" p="md" radius="md">
      <Stack gap="md">
        <CalendarHeader
          weekRange={currentWeek}
          appointmentCount={appointments?.length || 0}
          onPrevious={goToPreviousWeek}
          onNext={goToNextWeek}
          onToday={goToToday}
        />
        <WeekView
          weekRange={currentWeek}
          appointments={appointments || []}
          isLoading={isLoading}
          isError={isError}
        />
      </Stack>
    </Paper>
  );
}

// model/useCalendarNavigation.ts
import { useState, useCallback } from "react";
import { startOfWeek, endOfWeek, addWeeks, subWeeks } from "date-fns";

export function useCalendarNavigation() {
  const [currentDate, setCurrentDate] = useState(new Date());

  const currentWeek: [Date, Date] = [
    startOfWeek(currentDate, { weekStartsOn: 1 }), // Monday
    endOfWeek(currentDate, { weekStartsOn: 1 }), // Sunday
  ];

  const goToPreviousWeek = useCallback(() => {
    setCurrentDate((prev) => subWeeks(prev, 1));
  }, []);

  const goToNextWeek = useCallback(() => {
    setCurrentDate((prev) => addWeeks(prev, 1));
  }, []);

  const goToToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  return {
    currentWeek,
    currentDate,
    goToPreviousWeek,
    goToNextWeek,
    goToToday,
  };
}

// model/useWeekAppointments.ts
import { useMemo } from "react";
import { useAppointments } from "@entities/appointment";
import type { AppointmentFilters } from "@entities/appointment";

export function useWeekAppointments(filters: AppointmentFilters) {
  const query = useAppointments(filters);

  // Group appointments by day
  const appointmentsByDay = useMemo(() => {
    if (!query.data) return {};

    return query.data.reduce((acc, appointment) => {
      const day = format(new Date(appointment.dateTime), "yyyy-MM-dd");
      if (!acc[day]) acc[day] = [];
      acc[day].push(appointment);
      return acc;
    }, {} as Record<string, AppointmentReadModel[]>);
  }, [query.data]);

  return {
    ...query,
    appointmentsByDay,
  };
}
```

### 3. CalendarHeader (UI Component)

**Location:** `src/widgets/appointments-calendar/ui/CalendarHeader.tsx`

```typescript
import { Group, Text, Button, Badge } from "@mantine/core";
import { IconChevronLeft, IconChevronRight, IconCalendarEvent } from "@tabler/icons-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface CalendarHeaderProps {
  weekRange: [Date, Date];
  appointmentCount: number;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
}

export function CalendarHeader({
  weekRange,
  appointmentCount,
  onPrevious,
  onNext,
  onToday,
}: CalendarHeaderProps) {
  const [startDate, endDate] = weekRange;
  const dateRangeText = `${format(startDate, "MMM d", { locale: es })} - ${format(endDate, "MMM d, yyyy", { locale: es })}`;

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
```

### 4. WeekView (UI Component)

**Location:** `src/widgets/appointments-calendar/ui/WeekView.tsx`

```typescript
import { SimpleGrid, Box } from "@mantine/core";
import { DayColumn } from "./DayColumn";
import { eachDayOfInterval } from "date-fns";
import type { AppointmentReadModel } from "@entities/appointment";

interface WeekViewProps {
  weekRange: [Date, Date];
  appointments: AppointmentReadModel[];
  isLoading: boolean;
  isError: boolean;
}

export function WeekView({ weekRange, appointments, isLoading, isError }: WeekViewProps) {
  const [startDate, endDate] = weekRange;
  const daysInWeek = eachDayOfInterval({ start: startDate, end: endDate });

  // Group appointments by day
  const appointmentsByDay = appointments.reduce((acc, appointment) => {
    const day = format(new Date(appointment.dateTime), "yyyy-MM-dd");
    if (!acc[day]) acc[day] = [];
    acc[day].push(appointment);
    return acc;
  }, {} as Record<string, AppointmentReadModel[]>);

  return (
    <SimpleGrid
      cols={{ base: 1, sm: 3, md: 5, lg: 7 }}
      spacing="md"
      style={{ minHeight: "500px" }}
    >
      {daysInWeek.map((day) => {
        const dayKey = format(day, "yyyy-MM-dd");
        const dayAppointments = appointmentsByDay[dayKey] || [];

        return (
          <DayColumn
            key={dayKey}
            date={day}
            appointments={dayAppointments}
            isLoading={isLoading}
            isError={isError}
          />
        );
      })}
    </SimpleGrid>
  );
}
```

### 5. DayColumn (UI Component)

**Location:** `src/widgets/appointments-calendar/ui/DayColumn.tsx`

```typescript
import { Stack, Text, Box, Paper } from "@mantine/core";
import { format, isToday } from "date-fns";
import { es } from "date-fns/locale";
import { AppointmentSlot } from "./AppointmentSlot";
import { EmptyState } from "@shared/ui/EmptyState/EmptyState";
import type { AppointmentReadModel } from "@entities/appointment";

interface DayColumnProps {
  date: Date;
  appointments: AppointmentReadModel[];
  isLoading: boolean;
  isError: boolean;
}

export function DayColumn({ date, appointments, isLoading, isError }: DayColumnProps) {
  const dayName = format(date, "EEEE", { locale: es }).toUpperCase();
  const dayDate = format(date, "MMM d", { locale: es });
  const isCurrentDay = isToday(date);

  // Sort appointments by time
  const sortedAppointments = [...appointments].sort((a, b) =>
    new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()
  );

  return (
    <Paper
      shadow="xs"
      p="sm"
      radius="md"
      style={{
        borderTop: isCurrentDay ? "3px solid var(--mantine-color-blue-6)" : undefined,
        backgroundColor: isCurrentDay ? "var(--mantine-color-blue-0)" : undefined,
      }}
    >
      <Stack gap="sm">
        {/* Day Header */}
        <Box>
          <Text size="xs" fw={700} c={isCurrentDay ? "blue" : "dimmed"}>
            {dayName}
          </Text>
          <Text size="sm" fw={600}>
            {dayDate}
          </Text>
        </Box>

        {/* Appointments */}
        {isLoading ? (
          <Text size="sm" c="dimmed">Cargando...</Text>
        ) : isError ? (
          <Text size="sm" c="red">Error</Text>
        ) : sortedAppointments.length === 0 ? (
          <EmptyState message="Sin citas" size="sm" />
        ) : (
          <Stack gap="xs">
            {sortedAppointments.map((appointment) => (
              <AppointmentSlot key={appointment.id} appointment={appointment} />
            ))}
          </Stack>
        )}
      </Stack>
    </Paper>
  );
}
```

### 6. AppointmentSlot (UI Component)

**Location:** `src/widgets/appointments-calendar/ui/AppointmentSlot.tsx`

```typescript
import { Paper, Stack, Text, Group, Badge } from "@mantine/core";
import { format } from "date-fns";
import { getStatusColor } from "@entities/appointment";
import type { AppointmentReadModel } from "@entities/appointment";
import { useState } from "react";
import { AppointmentDetailsModal } from "@features/appointment/details";

interface AppointmentSlotProps {
  appointment: AppointmentReadModel;
}

export function AppointmentSlot({ appointment }: AppointmentSlotProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const statusColor = getStatusColor(appointment.status);
  const time = format(new Date(appointment.dateTime), "h:mm a");

  return (
    <>
      <Paper
        p="xs"
        radius="sm"
        style={{
          backgroundColor: `var(--mantine-color-${statusColor}-1)`,
          borderLeft: `3px solid var(--mantine-color-${statusColor}-6)`,
          cursor: "pointer",
        }}
        onClick={() => setDetailsOpen(true)}
      >
        <Stack gap={4}>
          <Text size="xs" fw={700} c={statusColor}>
            {time}
          </Text>
          <Text size="sm" fw={500} lineClamp={1}>
            {appointment.offeringName}
          </Text>
          <Text size="xs" c="dimmed" lineClamp={1}>
            {appointment.customerName}
          </Text>
        </Stack>
      </Paper>

      <AppointmentDetailsModal
        appointmentId={appointment.id}
        opened={detailsOpen}
        onClose={() => setDetailsOpen(false)}
      />
    </>
  );
}
```

### 7. AppointmentDetailsModal (Feature)

**Location:** `src/features/appointment/details/`

```typescript
// ui/AppointmentDetailsModal.tsx
import { Modal, Stack, Text, Group, Badge, Button, LoadingOverlay } from "@mantine/core";
import { useAppointment } from "@entities/appointment";
import { CancelAppointmentButton } from "@features/appointment/cancel";
import { formatAppointmentDateTime, getStatusColor } from "@entities/appointment";

interface AppointmentDetailsModalProps {
  appointmentId: string;
  opened: boolean;
  onClose: () => void;
}

export function AppointmentDetailsModal({
  appointmentId,
  opened,
  onClose,
}: AppointmentDetailsModalProps) {
  const { data: appointment, isLoading, isError } = useAppointment(appointmentId, {
    enabled: opened,
  });

  if (!appointment && !isLoading) return null;

  return (
    <Modal opened={opened} onClose={onClose} title="Detalles de la Cita" size="md">
      <LoadingOverlay visible={isLoading} />

      {isError && (
        <Text c="red">Error al cargar los detalles de la cita</Text>
      )}

      {appointment && (
        <Stack gap="md">
          <Group justify="space-between">
            <Text size="lg" fw={600}>
              {appointment.offeringName}
            </Text>
            <Badge color={getStatusColor(appointment.status)}>
              {appointment.status}
            </Badge>
          </Group>

          <Stack gap="xs">
            <Group>
              <Text size="sm" fw={500}>Cliente:</Text>
              <Text size="sm">{appointment.customerName}</Text>
            </Group>
            <Group>
              <Text size="sm" fw={500}>Teléfono:</Text>
              <Text size="sm">{appointment.customerPhone}</Text>
            </Group>
            <Group>
              <Text size="sm" fw={500}>Fecha y Hora:</Text>
              <Text size="sm">{formatAppointmentDateTime(appointment.dateTime)}</Text>
            </Group>
            <Group>
              <Text size="sm" fw={500}>Creada:</Text>
              <Text size="sm">{formatAppointmentDateTime(appointment.createdAt)}</Text>
            </Group>
          </Stack>

          {appointment.status === "CONFIRMED" && (
            <Group justify="flex-end">
              <CancelAppointmentButton
                appointmentId={appointment.id}
                onSuccess={onClose}
              />
            </Group>
          )}
        </Stack>
      )}
    </Modal>
  );
}
```

## Data Models

### Calendar-Specific Types

```typescript
// src/widgets/appointments-calendar/model/types.ts

export type ViewMode = "list" | "calendar";

export interface WeekRange {
  start: Date;
  end: Date;
}

export interface DayAppointments {
  date: Date;
  appointments: AppointmentReadModel[];
}

export interface CalendarFilters extends AppointmentFilters {
  weekRange: [Date, Date];
}
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: View Preference Persistence

_For any_ view selection (list or calendar), after selecting it and storing in localStorage, retrieving the value should return the same view preference.

**Validates: Requirements 1.4, 1.5**

### Property 2: Week Display Consistency

_For any_ week displayed in the calendar, the calendar should show exactly 7 consecutive days starting from Monday.

**Validates: Requirements 2.1**

### Property 3: Day Content Completeness

_For any_ day with appointments, the rendered output should contain the day name, date, and all appointments for that day.

**Validates: Requirements 2.3**

### Property 4: Chronological Appointment Ordering

_For any_ list of appointments on a single day, they should be sorted chronologically such that appointment[i].time ≤ appointment[i+1].time for all i.

**Validates: Requirements 2.4**

### Property 5: Appointment Data Display

_For any_ appointment in the calendar, the rendered output should contain its start time, offering name, and customer name.

**Validates: Requirements 2.5, 4.1, 4.2, 4.3**

### Property 6: Status-Based Styling

_For any_ appointment with a given status (CONFIRMED, CANCELLED, COMPLETED), it should have the corresponding color scheme (blue, red, green respectively).

**Validates: Requirements 2.7, 4.6**

### Property 7: Week Navigation Consistency

_For any_ current week W, clicking "Previous Week" should display week W-1, and clicking "Next Week" should display week W+1.

**Validates: Requirements 3.3, 3.4**

### Property 8: Today Navigation Invariant

_For any_ currently displayed week, clicking "Today" should always navigate to the week containing the current date.

**Validates: Requirements 3.5**

### Property 9: Date Range Header Accuracy

_For any_ displayed week with start date S and end date E, the calendar header should display the range "S - E" in the correct format.

**Validates: Requirements 3.6**

### Property 10: Current Day Highlighting

_For any_ calendar view, if today's date is within the visible week, the day column for today should have a visual highlight (border or background color).

**Validates: Requirements 3.7**

### Property 11: Duration-Based End Time Display

_For any_ appointment, if its duration is ≥ 60 minutes, the end time should be displayed; otherwise, it should not be displayed.

**Validates: Requirements 4.4**

### Property 12: Modal Content Completeness

_For any_ appointment, when its details modal is opened, the modal should display all required fields: customer name, phone, offering name, date, time, status, and creation date.

**Validates: Requirements 5.2**

### Property 13: Conditional Cancel Button

_For any_ appointment with status = CONFIRMED, the details modal should display a "Cancel Appointment" button; for other statuses, the button should not be displayed.

**Validates: Requirements 5.3**

### Property 14: Optimistic Update Consistency

_For any_ appointment that is cancelled, the calendar view should update immediately to reflect the new status before the API response is received.

**Validates: Requirements 5.4, 10.4**

### Property 15: Empty State Display

_For any_ day with zero appointments, an empty state message should be displayed for that day.

**Validates: Requirements 6.1**

### Property 16: Calendar Structure Invariant

_For any_ calendar state (loading, error, empty, or populated), the calendar grid structure showing 7 day columns should always be rendered.

**Validates: Requirements 6.5**

### Property 17: Responsive Column Count

_For any_ viewport width W, the number of visible day columns should be: 7 if W ≥ 1024px, 5 if 768px ≤ W < 1024px, and 1 if W < 768px.

**Validates: Requirements 7.1, 7.2, 7.3**

### Property 18: Filter Application

_For any_ filter selection (status, date range, offering), the calendar should display only appointments that match all active filters.

**Validates: Requirements 8.1, 8.2**

### Property 19: Filter State Persistence Across Views

_For any_ filter state F, if we set filters to F, switch from list to calendar view, then back to list view, the filters should still be F.

**Validates: Requirements 8.5**

### Property 20: Appointment Count Accuracy

_For any_ set of visible appointments A in the calendar, the header should display count = |A| (the number of appointments in set A).

**Validates: Requirements 8.4**

### Property 21: Time Zone Display Consistency

_For any_ appointment, its displayed time should be in the business's configured time zone, not the user's local time zone.

**Validates: Requirements 9.1**

### Property 22: Date Range Fetch Optimization

_For any_ displayed week W, the API request should fetch appointments only for the date range [W.start - 7 days, W.end + 7 days].

**Validates: Requirements 10.2**

### Property 23: Navigation Cache Utilization

_For any_ week W, if we navigate from W to W+1 and then back to W, the second visit to W should use cached data (no API request).

**Validates: Requirements 10.3**

## Error Handling

### API Errors

```typescript
// In WeekView component
if (isError) {
  return (
    <Alert icon={<IconInfoCircle />} title="Error al cargar citas" color="red">
      No se pudieron cargar las citas. Por favor, intenta de nuevo.
      <Button variant="subtle" onClick={() => refetch()}>
        Reintentar
      </Button>
    </Alert>
  );
}
```

### Modal Errors

```typescript
// In AppointmentDetailsModal
if (isError) {
  return (
    <Alert color="red">
      Error al cargar los detalles de la cita. Por favor, cierra e intenta de nuevo.
    </Alert>
  );
}
```

### Network Errors

- Use TanStack Query's built-in retry logic (3 retries with exponential backoff)
- Display user-friendly error messages
- Provide retry buttons for failed requests

### Validation Errors

- Date range validation: ensure start date ≤ end date
- Week navigation: prevent navigation to invalid dates
- Filter validation: ensure valid status values

## Testing Strategy

### Unit Tests

**Target:** Individual components and utilities

```typescript
// Example: dateUtils.test.ts
describe("getWeekRange", () => {
  it("should return 7 consecutive days starting from Monday", () => {
    const date = new Date("2024-12-18"); // Wednesday
    const [start, end] = getWeekRange(date);

    expect(format(start, "EEEE")).toBe("Monday");
    expect(format(end, "EEEE")).toBe("Sunday");
    expect(differenceInDays(end, start)).toBe(6);
  });
});

// Example: useCalendarNavigation.test.ts
describe("useCalendarNavigation", () => {
  it("should navigate to previous week", () => {
    const { result } = renderHook(() => useCalendarNavigation());
    const initialWeek = result.current.currentWeek;

    act(() => {
      result.current.goToPreviousWeek();
    });

    const newWeek = result.current.currentWeek;
    expect(differenceInDays(initialWeek[0], newWeek[0])).toBe(7);
  });
});
```

### Component Tests

**Target:** UI components with React Testing Library

```typescript
// Example: DayColumn.test.tsx
describe("DayColumn", () => {
  it("should display day name and date", () => {
    const date = new Date("2024-12-18");
    render(<DayColumn date={date} appointments={[]} isLoading={false} isError={false} />);

    expect(screen.getByText("MIÉRCOLES")).toBeInTheDocument();
    expect(screen.getByText(/dic 18/i)).toBeInTheDocument();
  });

  it("should sort appointments chronologically", () => {
    const appointments = [
      { id: "1", dateTime: "2024-12-18T14:00:00Z", offeringName: "Service B" },
      { id: "2", dateTime: "2024-12-18T10:00:00Z", offeringName: "Service A" },
    ];

    render(<DayColumn date={new Date("2024-12-18")} appointments={appointments} />);

    const slots = screen.getAllByText(/Service/);
    expect(slots[0]).toHaveTextContent("Service A"); // 10:00 AM first
    expect(slots[1]).toHaveTextContent("Service B"); // 2:00 PM second
  });
});
```

### Integration Tests

**Target:** Feature interactions with MSW

```typescript
// Example: AppointmentsCalendar.integration.test.tsx
describe("AppointmentsCalendar Integration", () => {
  it("should fetch and display appointments for current week", async () => {
    server.use(
      rest.get("/api/appointments", (req, res, ctx) => {
        return res(ctx.json(mockAppointments));
      })
    );

    render(<AppointmentsCalendar />);

    await waitFor(() => {
      expect(screen.getByText("Corte de Pelo")).toBeInTheDocument();
    });
  });

  it("should navigate to next week and fetch new appointments", async () => {
    render(<AppointmentsCalendar />);

    const nextButton = screen.getByRole("button", { name: /siguiente/i });
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText(/dic 25 - dic 31/i)).toBeInTheDocument();
    });
  });
});
```

### Property-Based Tests

**Target:** Universal properties with fast-check

```typescript
// Example: calendarProperties.pbt.test.ts
import { fc, test } from "@fast-check/vitest";

describe("Calendar Properties", () => {
  test.prop([fc.date()])("Week range should always contain 7 days", (date) => {
    const [start, end] = getWeekRange(date);
    const dayCount = differenceInDays(end, start) + 1;
    expect(dayCount).toBe(7);
  });

  test.prop([fc.array(fc.date())])(
    "Appointments should be sorted chronologically",
    (dates) => {
      const appointments = dates.map((date, i) => ({
        id: `${i}`,
        dateTime: date.toISOString(),
        offeringName: `Service ${i}`,
      }));

      const sorted = sortAppointmentsByTime(appointments);

      for (let i = 0; i < sorted.length - 1; i++) {
        const current = new Date(sorted[i].dateTime);
        const next = new Date(sorted[i + 1].dateTime);
        expect(current.getTime()).toBeLessThanOrEqual(next.getTime());
      }
    },
  );
});
```

### E2E Tests (Future)

**Target:** Complete user flows with Playwright

```typescript
// Example: calendar-navigation.e2e.ts
test("should navigate calendar and view appointment details", async ({
  page,
}) => {
  await page.goto("/appointments");

  // Switch to calendar view
  await page.click('button:has-text("Calendario")');

  // Verify calendar is displayed
  await expect(page.locator("text=LUNES")).toBeVisible();

  // Click on an appointment
  await page.click('text="Corte de Pelo"');

  // Verify modal opens
  await expect(page.locator('text="Detalles de la Cita"')).toBeVisible();

  // Navigate to next week
  await page.click('button:has-text("Siguiente")');

  // Verify date range updated
  await expect(page.locator("text=/dic 25 - dic 31/i")).toBeVisible();
});
```

## Performance Considerations

### Rendering Optimization

1. **Memoization**
   - Use `useMemo` for expensive computations (grouping appointments by day, sorting)
   - Use `React.memo` for DayColumn components to prevent unnecessary re-renders
   - Memoize date formatting functions

```typescript
// Example: Memoized appointment grouping
const appointmentsByDay = useMemo(() => {
  if (!appointments) return {};

  return appointments.reduce(
    (acc, appointment) => {
      const day = format(new Date(appointment.dateTime), "yyyy-MM-dd");
      if (!acc[day]) acc[day] = [];
      acc[day].push(appointment);
      return acc;
    },
    {} as Record<string, AppointmentReadModel[]>,
  );
}, [appointments]);

// Example: Memoized DayColumn
export const DayColumn = React.memo(
  ({ date, appointments, isLoading, isError }) => {
    // Component implementation
  },
);
```

2. **Virtualization** (Future Enhancement)
   - For businesses with many appointments per day, consider virtualizing the appointment list within each day column
   - Use `@tanstack/react-virtual` for efficient rendering of long lists

3. **Lazy Loading**
   - Lazy load the AppointmentDetailsModal component
   - Only fetch appointment details when modal is opened

```typescript
const AppointmentDetailsModal = lazy(() =>
  import("@features/appointment/details").then((m) => ({
    default: m.AppointmentDetailsModal,
  })),
);
```

### Data Fetching Optimization

1. **Query Key Strategy**
   - Use structured query keys for efficient cache invalidation
   - Include week range in query key for granular caching

```typescript
export const appointmentKeys = {
  all: ["appointments"] as const,
  lists: () => [...appointmentKeys.all, "list"] as const,
  list: (filters: AppointmentFilters) =>
    [...appointmentKeys.lists(), filters] as const,
  week: (weekRange: [Date, Date]) =>
    [...appointmentKeys.all, "week", weekRange] as const,
};
```

2. **Prefetching**
   - Prefetch adjacent weeks on hover of navigation buttons
   - Prefetch appointment details on hover of appointment slots

```typescript
const queryClient = useQueryClient();

const handleNextWeekHover = () => {
  const nextWeek = getNextWeekRange(currentWeek);
  queryClient.prefetchQuery({
    queryKey: appointmentKeys.week(nextWeek),
    queryFn: () => fetchAppointments({ dateRange: nextWeek }),
  });
};
```

3. **Stale Time Configuration**
   - Set appropriate stale times for different data types
   - Appointments: 30 seconds (relatively fresh)
   - Business settings: 5 minutes (rarely changes)

```typescript
const { data: appointments } = useAppointments(filters, {
  staleTime: 30 * 1000, // 30 seconds
  cacheTime: 5 * 60 * 1000, // 5 minutes
});
```

### Bundle Size Optimization

1. **Code Splitting**
   - Split calendar view into separate chunk
   - Load calendar components only when calendar view is selected

```typescript
// In AppointmentsPage.tsx
const AppointmentsCalendar = lazy(() =>
  import("@widgets/appointments-calendar").then(m => ({ default: m.AppointmentsCalendar }))
);

// Conditional rendering with Suspense
{view === "calendar" && (
  <Suspense fallback={<LoadingOverlay visible />}>
    <AppointmentsCalendar />
  </Suspense>
)}
```

2. **Tree Shaking**
   - Import only needed date-fns functions
   - Use named imports from Mantine

```typescript
// ✅ Good - tree-shakeable
import { format, startOfWeek, endOfWeek } from "date-fns";
import { Stack, Paper, Text } from "@mantine/core";

// ❌ Bad - imports entire library
import * as dateFns from "date-fns";
import * as Mantine from "@mantine/core";
```

### Network Optimization

1. **Request Deduplication**
   - TanStack Query automatically deduplicates identical requests
   - Multiple components requesting same week data will share single request

2. **Retry Strategy**
   - Configure exponential backoff for failed requests
   - Limit retries to avoid excessive network usage

```typescript
const { data: appointments } = useAppointments(filters, {
  retry: 3,
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
});
```

3. **Request Cancellation**
   - Cancel in-flight requests when navigating away
   - TanStack Query handles this automatically with query key changes

## Dependencies and Libraries

### Required Dependencies

```json
{
  "dependencies": {
    "@mantine/core": "^7.x",
    "@mantine/hooks": "^7.x",
    "@tanstack/react-query": "^5.x",
    "zustand": "^4.x",
    "date-fns": "^2.x",
    "date-fns-tz": "^2.x",
    "@tabler/icons-react": "^2.x"
  },
  "devDependencies": {
    "@testing-library/react": "^14.x",
    "@testing-library/user-event": "^14.x",
    "@fast-check/vitest": "^0.x",
    "msw": "^2.x",
    "vitest": "^1.x"
  }
}
```

### Library Justifications

1. **date-fns** (instead of moment.js or dayjs)
   - Tree-shakeable (smaller bundle size)
   - Immutable (functional approach)
   - TypeScript support
   - Active maintenance

2. **date-fns-tz** (timezone handling)
   - Lightweight timezone support
   - Works seamlessly with date-fns
   - Handles DST transitions correctly

3. **Zustand** (view preference state)
   - Minimal boilerplate
   - Built-in persistence middleware
   - TypeScript-first
   - No provider wrapper needed

4. **@mantine/core** (UI components)
   - Already used in project
   - Consistent design system
   - Accessible components
   - Good TypeScript support

5. **@tanstack/react-query** (data fetching)
   - Already used in project
   - Powerful caching and synchronization
   - Optimistic updates
   - Automatic refetching

### No Additional Calendar Library Needed

**Decision:** Implement custom calendar layout instead of using a third-party calendar library (e.g., FullCalendar, react-big-calendar)

**Rationale:**

- Simple week view doesn't require complex calendar features
- Avoid large bundle size of full-featured calendar libraries
- Full control over styling and behavior
- Better integration with existing Mantine UI design system
- Easier to customize for specific requirements

## Migration Path

### Phase 1: Foundation (Week 1)

1. **Create Feature Structure**
   - Create `features/appointment/view-toggle/` directory
   - Create `widgets/appointments-calendar/` directory
   - Set up basic file structure

2. **Implement View Toggle**
   - Create ViewToggle component with SegmentedControl
   - Implement useViewPreference hook with Zustand + persist
   - Add toggle to AppointmentsPage

3. **Modify AppointmentsPage**
   - Add conditional rendering based on view preference
   - Keep existing list view intact
   - Add Suspense boundary for calendar view

### Phase 2: Calendar Core (Week 1-2)

1. **Implement Calendar Navigation**
   - Create useCalendarNavigation hook
   - Implement week range calculation utilities
   - Add date formatting utilities

2. **Build Calendar Structure**
   - Create AppointmentsCalendar widget
   - Implement CalendarHeader component
   - Implement WeekView component
   - Implement DayColumn component

3. **Integrate with Existing Data**
   - Extend useAppointments hook to support week queries
   - Implement useWeekAppointments hook
   - Add query key strategy for week-based caching

### Phase 3: Appointment Display (Week 2)

1. **Implement AppointmentSlot**
   - Create AppointmentSlot component
   - Add status-based styling
   - Implement click handler for details

2. **Build Details Modal**
   - Create AppointmentDetailsModal feature
   - Integrate with existing useAppointment hook
   - Add cancel functionality integration

3. **Add Empty States**
   - Implement empty state for days without appointments
   - Add loading skeletons
   - Add error states

### Phase 4: Polish and Optimization (Week 2-3)

1. **Responsive Design**
   - Implement responsive column counts
   - Test on mobile, tablet, desktop
   - Adjust spacing and font sizes

2. **Performance Optimization**
   - Add memoization to expensive computations
   - Implement prefetching for adjacent weeks
   - Add code splitting for calendar view

3. **Testing**
   - Write unit tests for utilities and hooks
   - Write component tests for UI components
   - Write integration tests for calendar interactions
   - Add property-based tests for correctness properties

### Phase 5: Integration and Deployment (Week 3)

1. **Filter Integration**
   - Ensure existing filters work with calendar view
   - Test filter state persistence across view switches
   - Verify appointment count accuracy

2. **Timezone Handling**
   - Verify all times display in business timezone
   - Test DST transitions
   - Add timezone indicator if needed

3. **Final Testing and Bug Fixes**
   - Conduct thorough manual testing
   - Fix any discovered bugs
   - Verify all requirements are met

4. **Documentation**
   - Update component documentation
   - Add usage examples
   - Document any new patterns or utilities

### Rollback Plan

If critical issues are discovered after deployment:

1. **Immediate Rollback**
   - Set default view preference to "list" in useViewPreference
   - Hide calendar toggle button with feature flag
   - Users automatically see list view

2. **Gradual Rollout** (Alternative)
   - Enable calendar view for subset of users (A/B test)
   - Monitor for errors and performance issues
   - Gradually increase rollout percentage

## Deployment Considerations

### Build Configuration

No changes needed to Vite configuration. The calendar view will be automatically code-split due to lazy loading.

### Environment Variables

No new environment variables required. Calendar uses existing API endpoints and configuration.

### Feature Flags (Optional)

Consider adding a feature flag for gradual rollout:

```typescript
// src/shared/config/features.ts
export const FEATURES = {
  CALENDAR_VIEW: import.meta.env.VITE_FEATURE_CALENDAR_VIEW === "true",
};

// In AppointmentsPage.tsx
{FEATURES.CALENDAR_VIEW && <ViewToggle />}
```

### Monitoring

Add analytics events to track calendar usage:

```typescript
// Track view toggle
analytics.track("appointments_view_changed", {
  view: newView,
  timestamp: new Date().toISOString(),
});

// Track calendar navigation
analytics.track("calendar_week_navigated", {
  direction: "next" | "previous" | "today",
  timestamp: new Date().toISOString(),
});

// Track appointment interactions
analytics.track("calendar_appointment_clicked", {
  appointmentId: appointment.id,
  timestamp: new Date().toISOString(),
});
```

### Performance Monitoring

Monitor key metrics:

- Calendar initial load time (target: <2s)
- Week navigation time (target: <500ms)
- Modal open time (target: <300ms)
- API request count per session
- Cache hit rate

## Success Metrics

### Technical Metrics

- **Load Time:** Calendar view loads in <2 seconds (p95)
- **Navigation Time:** Week navigation completes in <500ms (p95)
- **Cache Hit Rate:** >80% for week navigation
- **Bundle Size:** Calendar chunk <100KB gzipped
- **Test Coverage:** >80% for calendar components

### User Experience Metrics

- **Adoption Rate:** >50% of users try calendar view within first week
- **Retention Rate:** >30% of users prefer calendar view after 1 week
- **Error Rate:** <1% of calendar interactions result in errors
- **Interaction Rate:** Average 5+ calendar interactions per session

### Business Metrics

- **Time to View Appointments:** Reduced by 30% compared to list view
- **Appointment Management Efficiency:** Increased by 20%
- **User Satisfaction:** NPS score >8 for calendar feature

## Future Enhancements

### Phase 2 Features (Post-MVP)

1. **Drag-and-Drop Rescheduling**
   - Allow dragging appointments to different time slots
   - Implement conflict detection
   - Add confirmation modal for reschedule

2. **Month View**
   - Add month view option alongside week view
   - Show appointment count per day
   - Click day to see day details

3. **Create Appointment from Calendar**
   - Click empty time slot to create appointment
   - Pre-fill date and time from clicked slot
   - Open create appointment modal

4. **Multi-Day Selection**
   - Select multiple days to view appointments
   - Useful for viewing specific days across weeks

5. **Print Calendar**
   - Generate printable calendar view
   - Include appointment details
   - Support custom date ranges

6. **Export Calendar**
   - Export to iCal format
   - Export to Google Calendar
   - Export to PDF

### Technical Improvements

1. **Virtualization**
   - Implement virtual scrolling for days with many appointments
   - Improve performance for high-volume businesses

2. **Offline Support**
   - Cache calendar data for offline viewing
   - Queue actions for sync when online

3. **Real-Time Updates**
   - WebSocket integration for live appointment updates
   - Show new appointments without refresh

4. **Advanced Filtering**
   - Filter by customer
   - Filter by time range
   - Save filter presets

## References

- **Requirements Document:** `.kiro/specs/appointments-calendar-view/requirements.md`
- **Frontend PRD:** `.kiro/steering/frontend-PRD.md`
- **Frontend Testing Conventions:** `.kiro/steering/frontend-testing-conventions.md`
- **FSD Documentation:** https://feature-sliced.design/
- **Mantine UI:** https://mantine.dev/
- **TanStack Query:** https://tanstack.com/query/latest
- **date-fns:** https://date-fns.org/
- **Zustand:** https://zustand-demo.pmnd.rs/

## Appendix: File Checklist

### New Files to Create

```
src/
├── features/
│   └── appointment/
│       ├── view-toggle/
│       │   ├── ui/
│       │   │   └── ViewToggle.tsx
│       │   ├── model/
│       │   │   └── useViewPreference.ts
│       │   └── index.ts
│       └── details/
│           ├── ui/
│           │   └── AppointmentDetailsModal.tsx
│           ├── model/
│           │   └── useAppointmentDetails.ts
│           └── index.ts
├── widgets/
│   └── appointments-calendar/
│       ├── ui/
│       │   ├── AppointmentsCalendar.tsx
│       │   ├── CalendarHeader.tsx
│       │   ├── WeekView.tsx
│       │   ├── DayColumn.tsx
│       │   └── AppointmentSlot.tsx
│       ├── model/
│       │   ├── useCalendarNavigation.ts
│       │   ├── useWeekAppointments.ts
│       │   └── types.ts
│       ├── lib/
│       │   ├── dateUtils.ts
│       │   └── appointmentLayout.ts
│       └── index.ts
└── entities/
    └── appointment/
        └── lib/
            └── statusColors.ts (if not exists)
```

### Files to Modify

```
src/
└── pages/
    └── AppointmentsPage/
        └── ui/
            └── AppointmentsPage.tsx (add toggle + conditional rendering)
```

### Test Files to Create

```
src/
├── features/
│   └── appointment/
│       ├── view-toggle/
│       │   └── __tests__/
│       │       ├── ViewToggle.test.tsx
│       │       └── useViewPreference.test.ts
│       └── details/
│           └── __tests__/
│               └── AppointmentDetailsModal.test.tsx
├── widgets/
│   └── appointments-calendar/
│       ├── ui/
│       │   └── __tests__/
│       │       ├── AppointmentsCalendar.test.tsx
│       │       ├── CalendarHeader.test.tsx
│       │       ├── WeekView.test.tsx
│       │       ├── DayColumn.test.tsx
│       │       └── AppointmentSlot.test.tsx
│       ├── model/
│       │   └── __tests__/
│       │       ├── useCalendarNavigation.test.ts
│       │       └── useWeekAppointments.test.ts
│       └── lib/
│           └── __tests__/
│               ├── dateUtils.test.ts
│               ├── dateUtils.pbt.test.ts
│               └── appointmentLayout.test.ts
```

---

**End of Design Document**

/**
 * Property-Based Tests for DayColumn Component
 *
 * Tests universal properties that should hold for any valid input
 */

import { describe, expect, vi } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MantineProvider } from "@mantine/core";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { DayColumn } from "../DayColumn";
import type { AppointmentReadModel } from "@entities/appointment";

// Mock useAppointment hook to prevent errors when clicking appointments
vi.mock("@entities/appointment", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@entities/appointment")>();
  return {
    ...actual,
    useAppointment: vi.fn(() => ({
      data: undefined,
      isLoading: false,
      error: null,
      isError: false,
      isSuccess: false,
      refetch: vi.fn(),
    })),
  };
});

// Test wrapper with providers
function TestWrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <MantineProvider>{children}</MantineProvider>
    </QueryClientProvider>
  );
}

// Arbitrary for generating appointments with valid dates
const appointmentArbitrary = fc.record({
  id: fc.uuid(),
  businessId: fc.uuid(),
  customerId: fc.uuid(),
  customerName: fc.option(fc.string({ minLength: 1, maxLength: 50 }), {
    nil: null,
  }),
  customerPhone: fc.string({ minLength: 10, maxLength: 15 }),
  offeringId: fc.uuid(),
  offeringName: fc.string({ minLength: 1, maxLength: 50 }),
  dateTime: fc
    .integer({
      min: new Date(2020, 0, 1).getTime(),
      max: new Date(2030, 11, 31).getTime(),
    })
    .map((timestamp) => new Date(timestamp).toISOString()),
  status: fc.constantFrom(
    "CONFIRMED",
    "CANCELLED",
    "COMPLETED",
  ) as fc.Arbitrary<"CONFIRMED" | "CANCELLED" | "COMPLETED">,
  createdAt: fc
    .integer({
      min: new Date(2020, 0, 1).getTime(),
      max: new Date(2030, 11, 31).getTime(),
    })
    .map((timestamp) => new Date(timestamp).toISOString()),
  cancelledAt: fc.option(
    fc
      .integer({
        min: new Date(2020, 0, 1).getTime(),
        max: new Date(2030, 11, 31).getTime(),
      })
      .map((timestamp) => new Date(timestamp).toISOString()),
    { nil: null },
  ),
});

/**
 * Property 3: Day Content Completeness
 *
 * Validates: Requirements 2.3
 *
 * For any day with appointments, the rendered output must contain:
 * - Day name (uppercase, Spanish)
 * - Date (Spanish format)
 * - All appointments for that day
 *
 * This property ensures no data is lost during rendering.
 */
describe("Property 3: Day Content Completeness", () => {
  test.prop([
    fc
      .integer({
        min: new Date(2020, 0, 1).getTime(),
        max: new Date(2030, 11, 31).getTime(),
      })
      .map((timestamp) => new Date(timestamp)),
    fc.array(appointmentArbitrary, { minLength: 1, maxLength: 10 }),
  ])(
    "should display day name, date, and all appointments",
    (date, appointments) => {
      const { container } = render(
        <TestWrapper>
          <DayColumn
            date={date}
            appointments={appointments as AppointmentReadModel[]}
          />
        </TestWrapper>,
      );

      const content = container.textContent || "";

      // Check day name is present (uppercase Spanish)
      const dayName = format(date, "EEEE", { locale: es }).toUpperCase();
      expect(content).toContain(dayName);

      // Check date is present (Spanish format)
      const dateFormatted = format(date, "d 'de' MMMM", { locale: es });
      expect(content).toContain(dateFormatted);

      // Check all appointments are present
      appointments.forEach((appointment) => {
        // Each appointment should have its offering name visible
        expect(content).toContain(appointment.offeringName);
      });
    },
  );

  test.prop([
    fc
      .integer({
        min: new Date(2020, 0, 1).getTime(),
        max: new Date(2030, 11, 31).getTime(),
      })
      .map((timestamp) => new Date(timestamp)),
    fc.array(appointmentArbitrary, { minLength: 1, maxLength: 10 }),
  ])("should display all appointment times", (date, appointments) => {
    const { container } = render(
      <TestWrapper>
        <DayColumn
          date={date}
          appointments={appointments as AppointmentReadModel[]}
        />
      </TestWrapper>,
    );

    const content = container.textContent || "";

    // Check all appointment times are present
    appointments.forEach((appointment) => {
      const time = format(new Date(appointment.dateTime), "h:mm a");
      expect(content).toContain(time);
    });
  });

  test.prop([
    fc
      .integer({
        min: new Date(2020, 0, 1).getTime(),
        max: new Date(2030, 11, 31).getTime(),
      })
      .map((timestamp) => new Date(timestamp)),
  ])("should display empty state when no appointments", (date) => {
    const { container } = render(
      <TestWrapper>
        <DayColumn date={date} appointments={[]} />
      </TestWrapper>,
    );

    const content = container.textContent || "";

    // Should still show day name and date
    const dayName = format(date, "EEEE", { locale: es }).toUpperCase();
    expect(content).toContain(dayName);

    // Should show empty state message
    expect(content).toContain("Sin citas");
  });
});

/**
 * Property 15: Empty State Display
 *
 * Validates: Requirements 6.1
 *
 * For any day with zero appointments, the empty state message must display.
 * This ensures users always understand when there are no appointments scheduled.
 */
describe("Property 15: Empty State Display", () => {
  test.prop([
    fc
      .integer({
        min: new Date(2020, 0, 1).getTime(),
        max: new Date(2030, 11, 31).getTime(),
      })
      .map((timestamp) => new Date(timestamp)),
  ])(
    "should display empty state for any day with zero appointments",
    (date) => {
      const { container, getAllByText } = render(
        <TestWrapper>
          <DayColumn date={date} appointments={[]} />
        </TestWrapper>,
      );

      // Empty state title should be visible (use getAllByText to handle multiple renders)
      const emptyStateTitles = getAllByText("Sin citas");
      expect(emptyStateTitles.length).toBeGreaterThan(0);

      // Empty state message should be visible
      const emptyStateMessages = getAllByText(
        "No hay citas programadas para este día",
      );
      expect(emptyStateMessages.length).toBeGreaterThan(0);

      // Day name and date should still be visible
      const dayName = format(date, "EEEE", { locale: es }).toUpperCase();
      const dateFormatted = format(date, "d 'de' MMMM", { locale: es });
      expect(container.textContent).toContain(dayName);
      expect(container.textContent).toContain(dateFormatted);
    },
  );

  test.prop([
    fc
      .integer({
        min: new Date(2020, 0, 1).getTime(),
        max: new Date(2030, 11, 31).getTime(),
      })
      .map((timestamp) => new Date(timestamp)),
  ])("should NOT display empty state when appointments exist", (date) => {
    const appointments = [
      {
        id: "test-id",
        businessId: "business-id",
        customerId: "customer-id",
        customerName: "Test Customer",
        customerPhone: "+1234567890",
        offeringId: "offering-id",
        offeringName: "Test Offering",
        dateTime: date.toISOString(),
        status: "CONFIRMED" as const,
        createdAt: new Date().toISOString(),
        cancelledAt: null,
      },
    ];

    const { queryAllByText } = render(
      <TestWrapper>
        <DayColumn date={date} appointments={appointments} />
      </TestWrapper>,
    );

    // Empty state should NOT be visible
    const emptyStateTitles = queryAllByText("Sin citas");
    expect(emptyStateTitles.length).toBe(0);

    const emptyStateMessages = queryAllByText(
      "No hay citas programadas para este día",
    );
    expect(emptyStateMessages.length).toBe(0);

    // Appointment should be visible instead
    const offeringNames = queryAllByText("Test Offering");
    expect(offeringNames.length).toBeGreaterThan(0);
  });
});

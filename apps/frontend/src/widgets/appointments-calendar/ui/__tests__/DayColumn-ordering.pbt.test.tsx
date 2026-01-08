/**
 * Property-Based Tests for DayColumn - Chronological Ordering
 *
 * Tests that appointments are always sorted chronologically
 */

import { describe, expect } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MantineProvider } from "@mantine/core";
import { DayColumn } from "../DayColumn";
import type { AppointmentReadModel } from "@entities/appointment";

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

// Arbitrary for generating appointments with valid dates and unique IDs
const appointmentArbitrary = fc.integer({ min: 0 }).chain((index) =>
  fc.record({
    id: fc.constant(`appointment-${index}-${crypto.randomUUID()}`),
    businessId: fc.constant(`business-${crypto.randomUUID()}`),
    customerId: fc.constant(`customer-${crypto.randomUUID()}`),
    customerName: fc.option(fc.string({ minLength: 1, maxLength: 50 }), {
      nil: null,
    }),
    customerPhone: fc.string({ minLength: 10, maxLength: 15 }),
    offeringId: fc.constant(`offering-${crypto.randomUUID()}`),
    offeringName: fc.constant(
      `Offering ${index} - ${crypto.randomUUID().slice(0, 8)}`,
    ),
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
  }),
);

/**
 * Property 4: Chronological Appointment Ordering
 *
 * Validates: Requirements 2.4
 *
 * For any list of appointments on a day, they must be sorted chronologically
 * by dateTime (earliest first).
 *
 * This property ensures appointments are always displayed in time order.
 */
describe("Property 4: Chronological Appointment Ordering", () => {
  test.prop([
    fc
      .date({ min: new Date(2020, 0, 1), max: new Date(2030, 11, 31) })
      .filter((d) => !isNaN(d.getTime())),
    fc.array(appointmentArbitrary, { minLength: 2, maxLength: 10 }),
  ])(
    "should display appointments in chronological order",
    (date, appointments) => {
      const { container } = render(
        <TestWrapper>
          <DayColumn
            date={date}
            appointments={appointments as AppointmentReadModel[]}
          />
        </TestWrapper>,
      );

      // Extract all time elements from the rendered output
      const timeElements = Array.from(
        container.querySelectorAll('[class*="fw-700"]'),
      )
        .filter((el) => {
          const text = el.textContent || "";
          // Match time format like "10:30 AM" or "2:45 PM"
          return /\d{1,2}:\d{2}\s[AP]M/.test(text);
        })
        .map((el) => el.textContent || "");

      // Verify that times appear in chronological order
      for (let i = 0; i < timeElements.length - 1; i++) {
        const time1 = timeElements[i];
        const time2 = timeElements[i + 1];

        // Parse times to compare
        const date1 = new Date(`2000-01-01 ${time1}`);
        const date2 = new Date(`2000-01-01 ${time2}`);

        // time1 should be <= time2 (chronological order)
        expect(date1.getTime()).toBeLessThanOrEqual(date2.getTime());
      }
    },
  );

  test.prop([
    fc
      .date({ min: new Date(2020, 0, 1), max: new Date(2030, 11, 31) })
      .filter((d) => !isNaN(d.getTime())),
    fc.array(appointmentArbitrary, { minLength: 2, maxLength: 10 }),
  ])(
    "should maintain chronological order regardless of input order",
    (date, appointments) => {
      // Shuffle appointments to test sorting
      const shuffled = [...appointments].sort(() => Math.random() - 0.5);

      const { container } = render(
        <TestWrapper>
          <DayColumn
            date={date}
            appointments={shuffled as AppointmentReadModel[]}
          />
        </TestWrapper>,
      );

      // Get sorted appointments by dateTime
      const sorted = [...appointments].sort(
        (a, b) =>
          new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime(),
      );

      // Extract all offering names in the order they appear
      // Offering names are in Text elements with fw={500}
      const offeringElements = Array.from(
        container.querySelectorAll("p"),
      ).filter((el) => {
        const text = el.textContent || "";
        // Find elements that contain offering names
        return sorted.some((a) => text === a.offeringName);
      });

      // Verify we have the correct number of offerings
      expect(offeringElements.length).toBe(sorted.length);

      // Verify each offering appears in chronological order
      offeringElements.forEach((element, index) => {
        const text = element.textContent || "";
        const expectedOffering = sorted[index].offeringName;

        // Each offering should match the expected order
        expect(text).toBe(expectedOffering);
      });
    },
  );
});

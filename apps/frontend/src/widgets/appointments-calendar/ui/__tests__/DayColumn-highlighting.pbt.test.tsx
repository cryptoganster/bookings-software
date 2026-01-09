/**
 * Property-Based Tests for DayColumn - Current Day Highlighting
 *
 * Tests that the current day is visually highlighted
 */

import { describe, expect } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MantineProvider } from "@mantine/core";
import { isToday } from "date-fns";
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

// Arbitrary for generating appointments
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
 * Property 10: Current Day Highlighting
 *
 * Validates: Requirements 3.7
 *
 * If today is in the visible week, today's column must have visual highlight
 * (blue border and background).
 *
 * This property ensures the current day is always visually distinct.
 */
describe("Property 10: Current Day Highlighting", () => {
  test.prop([fc.array(appointmentArbitrary, { minLength: 0, maxLength: 10 })])(
    "should highlight current day with blue border and background",
    (appointments) => {
      const today = new Date();

      const { container } = render(
        <TestWrapper>
          <DayColumn
            date={today}
            appointments={appointments as AppointmentReadModel[]}
          />
        </TestWrapper>,
      );

      // Get the Paper element (the main container)
      const paper = container.querySelector('[class*="Paper"]');
      expect(paper).toBeTruthy();

      // Check for blue border styling
      const style = paper?.getAttribute("style") || "";

      // Should have blue border color
      expect(style).toContain("border-color");
      expect(style).toContain("blue");

      // Should have thicker border (2px)
      expect(style).toContain("border-width");
      expect(style).toContain("2");

      // Should have blue background
      expect(style).toContain("background-color");
      expect(style).toContain("blue");
    },
  );

  test.prop([
    fc
      .date({ min: new Date(2020, 0, 1), max: new Date(2030, 11, 31) })
      .filter((d) => !isNaN(d.getTime()) && !isToday(d)),
    fc.array(appointmentArbitrary, { minLength: 0, maxLength: 10 }),
  ])("should not highlight non-current days", (date, appointments) => {
    const { container } = render(
      <TestWrapper>
        <DayColumn
          date={date}
          appointments={appointments as AppointmentReadModel[]}
        />
      </TestWrapper>,
    );

    // Get the Paper element
    const paper = container.querySelector('[class*="Paper"]');
    expect(paper).toBeTruthy();

    const style = paper?.getAttribute("style") || "";

    // Should NOT have blue border color (or should have default border)
    // If border-color is present, it should not be blue
    if (style.includes("border-color")) {
      expect(style).not.toContain("blue");
    }

    // Should have normal border width (1px)
    if (style.includes("border-width")) {
      expect(style).toContain("1");
      expect(style).not.toContain("2");
    }

    // Should NOT have blue background
    if (style.includes("background-color")) {
      expect(style).not.toContain("blue");
    }
  });
});

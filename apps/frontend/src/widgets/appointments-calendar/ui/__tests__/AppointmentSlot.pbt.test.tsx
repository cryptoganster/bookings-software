/**
 * Property-Based Tests for AppointmentSlot Component
 *
 * These tests validate universal properties that must hold for ANY appointment data.
 */

import { render } from "@/test/test-utils";
import { fc, test } from "@fast-check/vitest";
import { describe } from "vitest";
import { AppointmentSlot } from "../AppointmentSlot";
import type { AppointmentStatus } from "@entities/appointment";

// Arbitraries for generating test data
const appointmentStatusArbitrary = fc.constantFrom<AppointmentStatus>(
  "CONFIRMED",
  "CANCELLED",
  "COMPLETED",
);

const appointmentArbitrary = fc.record({
  id: fc.uuid(),
  businessId: fc.uuid(),
  customerId: fc.uuid(),
  customerName: fc
    .string({ minLength: 2, maxLength: 100 })
    .filter((s) => s.trim().length > 0),
  customerPhone: fc.string({ minLength: 10, maxLength: 15 }),
  offeringId: fc.uuid(),
  offeringName: fc
    .string({ minLength: 2, maxLength: 100 })
    .filter((s) => s.trim().length > 0),
  dateTime: fc.date().map((d) => d.toISOString()),
  status: appointmentStatusArbitrary,
  createdAt: fc.date().map((d) => d.toISOString()),
  cancelledAt: fc.constant(null),
});

describe("AppointmentSlot - Property-Based Tests", () => {
  /**
   * Property 5: Appointment Data Display
   * Validates: Requirements 2.5, 4.1, 4.2, 4.3
   *
   * For ANY appointment, the rendered output must contain:
   * - Time in 12-hour format (h:mm a)
   * - Offering name
   * - Customer name
   */
  test.prop([appointmentArbitrary])(
    "Property 5: displays time, offering name, and customer name for any appointment",
    (appointment) => {
      const { container } = render(
        <AppointmentSlot appointment={appointment} />,
      );

      // Extract time from dateTime
      const date = new Date(appointment.dateTime);
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const period = hours >= 12 ? "PM" : "AM";
      const displayHours = hours % 12 || 12;
      const expectedTime = `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;

      // Verify time is displayed
      expect(container.textContent).toContain(expectedTime);

      // Verify offering name is displayed
      expect(container.textContent).toContain(appointment.offeringName);

      // Verify customer name is displayed
      expect(container.textContent).toContain(appointment.customerName);
    },
  );

  /**
   * Property 6: Status-Based Styling
   * Validates: Requirements 2.7, 4.6
   *
   * For ANY appointment with status S, it must have the corresponding color scheme:
   * - CONFIRMED → green
   * - CANCELLED → red
   * - COMPLETED → blue
   */
  test.prop([appointmentArbitrary])(
    "Property 6: applies correct color scheme based on status",
    (appointment) => {
      const { container } = render(
        <AppointmentSlot appointment={appointment} />,
      );

      // Map status to expected color
      const expectedColor = {
        CONFIRMED: "green",
        CANCELLED: "red",
        COMPLETED: "blue",
      }[appointment.status];

      // Find the Paper element (first div with style attribute)
      const paperElement = container.querySelector('[style*="background"]');
      expect(paperElement).toBeTruthy();

      // Verify background color contains the expected color
      const style = paperElement?.getAttribute("style") || "";
      expect(style).toContain(`--mantine-color-${expectedColor}-1`);

      // Verify border color contains the expected color
      expect(style).toContain(`--mantine-color-${expectedColor}-6`);
    },
  );
});

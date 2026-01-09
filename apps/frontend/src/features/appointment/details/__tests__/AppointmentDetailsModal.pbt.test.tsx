/**
 * Property-Based Tests for AppointmentDetailsModal
 *
 * Tests universal properties that should hold for any valid appointment data.
 */

import { describe, beforeAll, afterEach, afterAll } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MantineProvider } from "@mantine/core";
import { http, HttpResponse } from "msw";
import { server } from "@/mocks/server";
import { AppointmentDetailsModal } from "../ui/AppointmentDetailsModal";
import type { AppointmentReadModel } from "@entities/appointment";

beforeAll(() => server.listen({ onUnhandledRequest: "warn" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Helper to create a wrapper with providers
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MantineProvider>{children}</MantineProvider>
      </QueryClientProvider>
    );
  };
}

// Arbitrary for generating valid appointment data
const appointmentArbitrary = fc.record({
  id: fc.uuid(),
  businessId: fc.uuid(),
  customerId: fc.uuid(),
  customerName: fc
    .string({ minLength: 2, maxLength: 50 })
    .filter((s) => s.trim().length > 0),
  customerPhone: fc
    .string({ minLength: 10, maxLength: 15 })
    .filter((s) => s.trim().length >= 10),
  offeringId: fc.uuid(),
  offeringName: fc
    .string({ minLength: 2, maxLength: 50 })
    .filter((s) => s.trim().length > 0),
  dateTime: fc
    .integer({
      min: Date.parse("2020-01-01"),
      max: Date.parse("2030-12-31"),
    })
    .map((timestamp) => new Date(timestamp).toISOString()),
  status: fc.constantFrom(
    "CONFIRMED",
    "CANCELLED",
    "COMPLETED",
  ) as fc.Arbitrary<"CONFIRMED" | "CANCELLED" | "COMPLETED">,
  createdAt: fc
    .integer({
      min: Date.parse("2020-01-01"),
      max: Date.now(),
    })
    .map((timestamp) => new Date(timestamp).toISOString()),
  cancelledAt: fc.option(
    fc
      .integer({
        min: Date.parse("2020-01-01"),
        max: Date.now(),
      })
      .map((timestamp) => new Date(timestamp).toISOString()),
    { nil: null },
  ),
});

describe("AppointmentDetailsModal - Property-Based Tests", () => {
  /**
   * Property 12: Modal Content Completeness
   *
   * For any appointment, when the modal is opened with appointment data loaded,
   * the modal should display ALL required fields:
   * - Customer name
   * - Customer phone
   * - Offering name
   * - Date and time
   * - Status
   * - Creation date
   *
   * Validates: Requirements 5.2
   */
  test.prop([appointmentArbitrary], { numRuns: 5 })(
    "Property 12: Modal displays all required appointment fields",
    async (appointment: AppointmentReadModel) => {
      // Mock API response for this appointment
      // Use wildcard pattern to match any host/port combination
      server.use(
        http.get(`*/api/appointments/${appointment.id}`, () => {
          return HttpResponse.json(appointment);
        }),
      );

      const Wrapper = createWrapper();

      const { unmount } = render(
        <AppointmentDetailsModal
          appointmentId={appointment.id}
          opened={true}
          onClose={() => {}}
        />,
        { wrapper: Wrapper },
      );

      try {
        // Wait for loading to complete (loading overlay disappears)
        await waitFor(
          () => {
            const loadingOverlay = document.querySelector(
              ".mantine-LoadingOverlay-root",
            );
            expect(loadingOverlay).not.toBeInTheDocument();
          },
          { timeout: 2000 },
        );

        // Verify all required fields are displayed
        // Note: We check for the presence of the data, not exact formatting
        // since formatting is tested separately

        // Strategy: Use queryAllByText with a function matcher to handle edge cases
        // This is more flexible than regex for handling whitespace normalization

        // Customer name should be visible
        const customerNameText = (
          appointment.customerName || "Sin nombre"
        ).trim();
        const customerNameMatches = screen.queryAllByText(
          (_content, element) => {
            return element?.textContent?.trim() === customerNameText;
          },
        );
        expect(customerNameMatches.length).toBeGreaterThan(0);

        // Customer phone should be visible
        const customerPhoneText = appointment.customerPhone.trim();
        const customerPhoneMatches = screen.queryAllByText(
          (_content, element) => {
            return element?.textContent?.trim() === customerPhoneText;
          },
        );
        expect(customerPhoneMatches.length).toBeGreaterThan(0);

        // Offering name should be visible (as title)
        const offeringNameText = appointment.offeringName.trim();
        const offeringNameMatches = screen.queryAllByText(
          (_content, element) => {
            return element?.textContent?.trim() === offeringNameText;
          },
        );
        expect(offeringNameMatches.length).toBeGreaterThan(0);

        // Status should be visible
        expect(screen.getByText(appointment.status)).toBeInTheDocument();

        // Labels should be present (these are unique)
        expect(screen.getByText("Cliente:")).toBeInTheDocument();
        expect(screen.getByText("Teléfono:")).toBeInTheDocument();
        expect(screen.getByText("Fecha y Hora:")).toBeInTheDocument();
        expect(screen.getByText("Creada:")).toBeInTheDocument();
      } finally {
        // Always cleanup to prevent modal stacking
        unmount();
      }
    },
  );

  /**
   * Property 13: Conditional Cancel Button
   *
   * For any appointment:
   * - If status === "CONFIRMED", cancel button MUST be displayed
   * - If status !== "CONFIRMED", cancel button MUST NOT be displayed
   *
   * Validates: Requirements 5.3
   */
  test.prop([appointmentArbitrary], { numRuns: 5 })(
    "Property 13: Cancel button shows only for CONFIRMED status",
    async (appointment: AppointmentReadModel) => {
      // Mock API response for this appointment
      // Use wildcard pattern to match any host/port combination
      server.use(
        http.get(`*/api/appointments/${appointment.id}`, () => {
          return HttpResponse.json(appointment);
        }),
      );

      const Wrapper = createWrapper();

      const { unmount } = render(
        <AppointmentDetailsModal
          appointmentId={appointment.id}
          opened={true}
          onClose={() => {}}
        />,
        { wrapper: Wrapper },
      );

      try {
        // Wait for loading to complete (loading overlay disappears)
        await waitFor(
          () => {
            const loadingOverlay = document.querySelector(
              ".mantine-LoadingOverlay-root",
            );
            expect(loadingOverlay).not.toBeInTheDocument();
          },
          { timeout: 2000 },
        );

        // Check for cancel button based on status
        // Use getAllByRole to handle multiple buttons, then filter
        const allButtons = screen.queryAllByRole("button");
        const cancelButton = allButtons.find((button) =>
          button.textContent?.match(/cancelar cita/i),
        );

        if (appointment.status === "CONFIRMED") {
          // Cancel button MUST be present for CONFIRMED appointments
          expect(cancelButton).toBeDefined();
        } else {
          // Cancel button MUST NOT be present for non-CONFIRMED appointments
          expect(cancelButton).toBeUndefined();
        }
      } finally {
        // Always cleanup to prevent modal stacking
        unmount();
      }
    },
  );
});

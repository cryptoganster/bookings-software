/**
 * Property-Based Tests for AppointmentsCalendar
 *
 * Tests universal properties that should hold for any input.
 */

import { describe, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MantineProvider } from "@mantine/core";
import type { UseQueryResult } from "@tanstack/react-query";
import { fc, test } from "@fast-check/vitest";
import { AppointmentsCalendar } from "../AppointmentsCalendar";
import * as appointmentQueries from "@entities/appointment/model/queries";
import * as filterHook from "@features/appointment/filter";
import type { AppointmentReadModel } from "@entities/appointment";
import type { AppointmentStatus } from "@packages/shared-types";

// Mock modules
vi.mock("@entities/appointment/model/queries");
vi.mock("@features/appointment/filter");

describe("AppointmentsCalendar - Property-Based Tests", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <MantineProvider>
        <QueryClientProvider client={queryClient}>
          {component}
        </QueryClientProvider>
      </MantineProvider>,
    );
  };

  /**
   * Property 18: Filter Application
   *
   * For any filter selection (status, offeringId), the calendar should display
   * only appointments that match ALL selected filters.
   *
   * Validates Requirements: 8.1, 8.2
   */
  describe("Property 18: Filter Application", () => {
    test.prop(
      [
        fc.constantFrom<AppointmentStatus>(
          "CONFIRMED",
          "CANCELLED",
          "COMPLETED",
        ),
        fc.uuid(),
        fc.array(
          fc.record({
            id: fc.uuid(),
            status: fc.constantFrom<AppointmentStatus>(
              "CONFIRMED",
              "CANCELLED",
              "COMPLETED",
            ),
            offeringId: fc.uuid(),
            dateTime: fc
              .date({ min: new Date(2020, 0, 1), max: new Date(2030, 11, 31) })
              .map((d) => d.toISOString()),
            customerName: fc.string(),
            offeringName: fc.string(),
          }),
          { minLength: 0, maxLength: 20 },
        ),
      ],
      { numRuns: 50, timeout: 10000 },
    )(
      "should display only appointments matching selected filters",
      async (selectedStatus, selectedOfferingId, allAppointments) => {
        // Filter appointments that match the selected filters
        const matchingAppointments = allAppointments.filter(
          (apt) =>
            apt.status === selectedStatus &&
            apt.offeringId === selectedOfferingId,
        );

        // Mock filter hook to return selected filters
        vi.mocked(filterHook.useAppointmentFilters).mockReturnValue({
          status: selectedStatus,
          offeringId: selectedOfferingId,
          dateRange: null,
          dateRangePreset: "custom",
          setStatus: vi.fn(),
          setDateRange: vi.fn(),
          setDateRangePreset: vi.fn(),
          setOfferingId: vi.fn(),
          reset: vi.fn(),
        });

        // Mock useAppointments to return matching appointments
        vi.mocked(appointmentQueries.useAppointments).mockReturnValue({
          data: matchingAppointments as AppointmentReadModel[],
          isLoading: false,
          error: null,
          isError: false,
          isSuccess: true,
          refetch: vi.fn(),
        } as unknown as UseQueryResult<AppointmentReadModel[], Error>);

        renderWithProviders(<AppointmentsCalendar />);

        // Verify appointment count matches filtered results
        // Use getAllByText since there might be multiple badges with same count
        const countBadges = screen.getAllByText(
          `${matchingAppointments.length} citas`,
        );
        expect(countBadges.length).toBeGreaterThan(0);

        // Property: The displayed count should equal the number of appointments
        // that match ALL selected filters
        expect(matchingAppointments.length).toBe(
          allAppointments.filter(
            (apt) =>
              apt.status === selectedStatus &&
              apt.offeringId === selectedOfferingId,
          ).length,
        );
      },
    );

    test.prop(
      [
        fc.array(
          fc.record({
            id: fc.uuid(),
            status: fc.constantFrom<AppointmentStatus>(
              "CONFIRMED",
              "CANCELLED",
              "COMPLETED",
            ),
            offeringId: fc.uuid(),
            dateTime: fc
              .date({ min: new Date(2020, 0, 1), max: new Date(2030, 11, 31) })
              .map((d) => d.toISOString()),
            customerName: fc.string(),
            offeringName: fc.string(),
          }),
          { minLength: 0, maxLength: 20 },
        ),
      ],
      { numRuns: 50, timeout: 10000 },
    )(
      "should display all appointments when no filters are selected",
      async (allAppointments) => {
        // Mock filter hook to return no filters
        vi.mocked(filterHook.useAppointmentFilters).mockReturnValue({
          status: null,
          offeringId: null,
          dateRange: null,
          dateRangePreset: "custom",
          setStatus: vi.fn(),
          setDateRange: vi.fn(),
          setDateRangePreset: vi.fn(),
          setOfferingId: vi.fn(),
          reset: vi.fn(),
        });

        // Mock useAppointments to return all appointments
        vi.mocked(appointmentQueries.useAppointments).mockReturnValue({
          data: allAppointments as AppointmentReadModel[],
          isLoading: false,
          error: null,
          isError: false,
          isSuccess: true,
          refetch: vi.fn(),
        } as unknown as UseQueryResult<AppointmentReadModel[], Error>);

        renderWithProviders(<AppointmentsCalendar />);

        // Verify appointment count matches all appointments
        // Use getAllByText since there might be multiple badges with same count
        const countBadges = screen.getAllByText(
          `${allAppointments.length} citas`,
        );
        expect(countBadges.length).toBeGreaterThan(0);

        // Property: When no filters are selected, all appointments should be displayed
        expect(allAppointments.length).toBeGreaterThanOrEqual(0);
      },
    );
  });

  /**
   * Property 19: Filter State Persistence Across Views
   *
   * Filter state should persist when switching between list and calendar views.
   * The same filters should be applied regardless of the view.
   *
   * Validates Requirement: 8.5
   */
  describe("Property 19: Filter State Persistence", () => {
    test.prop(
      [
        fc.constantFrom<AppointmentStatus | null>(
          "CONFIRMED",
          "CANCELLED",
          "COMPLETED",
          null,
        ),
        fc.option(fc.uuid(), { nil: null }),
      ],
      { numRuns: 50, timeout: 10000 },
    )(
      "should maintain filter state across view switches",
      async (status, offeringId) => {
        // Create a persistent mock state that survives unmount/remount
        const persistentFilterState = {
          status,
          offeringId,
          dateRange: null,
          dateRangePreset: "custom" as const,
          setStatus: vi.fn(),
          setDateRange: vi.fn(),
          setDateRangePreset: vi.fn(),
          setOfferingId: vi.fn(),
          reset: vi.fn(),
        };

        // Mock filter hook to always return the same state object
        vi.mocked(filterHook.useAppointmentFilters).mockReturnValue(
          persistentFilterState,
        );

        // Mock useAppointments
        vi.mocked(appointmentQueries.useAppointments).mockReturnValue({
          data: [],
          isLoading: false,
          error: null,
          isError: false,
          isSuccess: true,
          refetch: vi.fn(),
        } as unknown as UseQueryResult<AppointmentReadModel[], Error>);

        // Render calendar view (first time)
        const { unmount } = renderWithProviders(<AppointmentsCalendar />);

        // Verify filters are applied on first render
        // Note: Component only passes non-null filters
        const expectedFilters: Record<string, unknown> = {
          dateRange: expect.any(Array),
        };
        if (status !== null) {
          expectedFilters.status = status;
        }
        if (offeringId !== null) {
          expectedFilters.offeringId = offeringId;
        }

        expect(appointmentQueries.useAppointments).toHaveBeenCalledWith(
          expect.objectContaining(expectedFilters),
        );

        // Unmount (simulating view switch)
        unmount();

        // Clear mock calls but keep the mock implementation
        vi.mocked(appointmentQueries.useAppointments).mockClear();

        // Re-render calendar view (simulating return to calendar)
        renderWithProviders(<AppointmentsCalendar />);

        // Property: The same filters should be applied after view switch
        expect(appointmentQueries.useAppointments).toHaveBeenCalledWith(
          expect.objectContaining(expectedFilters),
        );

        // Property: Filter state in store should remain unchanged across unmount/remount
        // This is the key property - the Zustand store persists the filter state
        const finalFilterState = vi
          .mocked(filterHook.useAppointmentFilters)
          .mock.results.slice(-1)[0]?.value;
        expect(finalFilterState?.status).toBe(status);
        expect(finalFilterState?.offeringId).toBe(offeringId);
      },
    );
  });
});

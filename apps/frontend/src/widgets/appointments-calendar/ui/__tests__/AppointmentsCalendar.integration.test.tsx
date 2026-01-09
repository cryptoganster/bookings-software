/**
 * Integration Tests for AppointmentsCalendar
 *
 * Tests the integration of navigation, filters, and data fetching.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MantineProvider } from "@mantine/core";
import type { UseQueryResult } from "@tanstack/react-query";
import { AppointmentsCalendar } from "../AppointmentsCalendar";
import { useAppointments } from "@entities/appointment";
import * as filterHook from "@features/appointment/filter";
import type { AppointmentReadModel } from "@entities/appointment";

// Mock modules - use importOriginal to preserve other exports
vi.mock("@entities/appointment", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@entities/appointment")>();
  return {
    ...actual,
    useAppointments: vi.fn(),
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
vi.mock("@features/appointment/filter");

describe("AppointmentsCalendar - Integration Tests", () => {
  let queryClient: QueryClient;
  const mockSetStatus = vi.fn();
  const mockSetOfferingId = vi.fn();
  const mockSetDateRange = vi.fn();
  const mockSetDateRangePreset = vi.fn();
  const mockReset = vi.fn();

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.clearAllMocks();

    // Default mock for filter hook
    vi.mocked(filterHook.useAppointmentFilters).mockReturnValue({
      status: null,
      offeringId: null,
      dateRange: null,
      dateRangePreset: "custom",
      setStatus: mockSetStatus,
      setOfferingId: mockSetOfferingId,
      setDateRange: mockSetDateRange,
      setDateRangePreset: mockSetDateRangePreset,
      reset: mockReset,
    });
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

  const createMockAppointment = (
    overrides?: Partial<AppointmentReadModel>,
  ): AppointmentReadModel => ({
    id: "apt-1",
    businessId: "biz-1",
    customerId: "cust-1",
    customerName: "John Doe",
    customerPhone: "+1234567890",
    offeringId: "off-1",
    offeringName: "Haircut",
    dateTime: new Date().toISOString(),
    status: "CONFIRMED",
    createdAt: new Date().toISOString(),
    cancelledAt: null,
    ...overrides,
  });

  /**
   * Test: Calendar fetches and displays appointments for current week
   * Validates Requirements: 2.1, 2.2, 2.3
   */
  it("should fetch and display appointments for current week", async () => {
    const mockAppointments = [
      createMockAppointment({ id: "apt-1", customerName: "Alice" }),
      createMockAppointment({ id: "apt-2", customerName: "Bob" }),
      createMockAppointment({ id: "apt-3", customerName: "Charlie" }),
    ];

    vi.mocked(useAppointments).mockReturnValue({
      data: mockAppointments,
      isLoading: false,
      error: null,
      isError: false,
      isSuccess: true,
      refetch: vi.fn(),
    } as unknown as UseQueryResult<AppointmentReadModel[], Error>);

    renderWithProviders(<AppointmentsCalendar />);

    // Verify appointment count is displayed
    await waitFor(() => {
      expect(screen.getByText("3 citas")).toBeInTheDocument();
    });

    // Verify useAppointments was called with current week date range
    expect(useAppointments).toHaveBeenCalledWith(
      expect.objectContaining({
        dateRange: expect.any(Array),
      }),
    );

    const callArgs = vi.mocked(useAppointments).mock.calls[0][0];
    expect(callArgs?.dateRange).toHaveLength(2);
    expect(callArgs?.dateRange?.[0]).toBeInstanceOf(Date);
    expect(callArgs?.dateRange?.[1]).toBeInstanceOf(Date);
  });

  /**
   * Test: Navigation to next week fetches new appointments
   * Validates Requirements: 3.3, 3.4
   */
  it("should fetch new appointments when navigating to next week", async () => {
    const user = userEvent.setup();
    const currentWeekAppointments = [createMockAppointment({ id: "apt-1" })];
    const nextWeekAppointments = [createMockAppointment({ id: "apt-2" })];

    // Mock initial call for current week
    vi.mocked(useAppointments).mockReturnValue({
      data: currentWeekAppointments,
      isLoading: false,
      error: null,
      isError: false,
      isSuccess: true,
      refetch: vi.fn(),
    } as unknown as UseQueryResult<AppointmentReadModel[], Error>);

    renderWithProviders(<AppointmentsCalendar />);

    // Verify initial count
    await waitFor(() => {
      expect(screen.getByText("1 citas")).toBeInTheDocument();
    });

    // Update mock for next week
    vi.mocked(useAppointments).mockReturnValue({
      data: nextWeekAppointments,
      isLoading: false,
      error: null,
      isError: false,
      isSuccess: true,
      refetch: vi.fn(),
    } as unknown as UseQueryResult<AppointmentReadModel[], Error>);

    // Click next week button
    const nextButton = screen.getByRole("button", { name: /siguiente/i });
    await user.click(nextButton);

    // Wait for the component to update with new data
    await waitFor(() => {
      // The count should still be 1 since we're showing next week's appointments
      expect(screen.getByText("1 citas")).toBeInTheDocument();
    });

    // Verify useAppointments was called multiple times (initial + after navigation)
    expect(useAppointments).toHaveBeenCalled();

    // Verify the calls have different date ranges
    const calls = vi.mocked(useAppointments).mock.calls;
    expect(calls.length).toBeGreaterThanOrEqual(2);

    // Get first and last call to compare date ranges
    const firstCall = calls[0][0];
    const lastCall = calls[calls.length - 1][0];

    expect(lastCall?.dateRange?.[0].getTime()).toBeGreaterThan(
      firstCall?.dateRange?.[0].getTime() ?? 0,
    );
  });

  /**
   * Test: Navigation to previous week fetches new appointments
   * Validates Requirements: 3.3, 3.4
   */
  it("should fetch new appointments when navigating to previous week", async () => {
    const user = userEvent.setup();
    const currentWeekAppointments = [createMockAppointment({ id: "apt-1" })];
    const previousWeekAppointments = [createMockAppointment({ id: "apt-2" })];

    vi.mocked(useAppointments).mockReturnValue({
      data: currentWeekAppointments,
      isLoading: false,
      error: null,
      isError: false,
      isSuccess: true,
      refetch: vi.fn(),
    } as unknown as UseQueryResult<AppointmentReadModel[], Error>);

    renderWithProviders(<AppointmentsCalendar />);

    // Verify initial count
    await waitFor(() => {
      expect(screen.getByText("1 citas")).toBeInTheDocument();
    });

    // Update mock for previous week
    vi.mocked(useAppointments).mockReturnValue({
      data: previousWeekAppointments,
      isLoading: false,
      error: null,
      isError: false,
      isSuccess: true,
      refetch: vi.fn(),
    } as unknown as UseQueryResult<AppointmentReadModel[], Error>);

    // Click previous week button
    const prevButton = screen.getByRole("button", { name: /anterior/i });
    await user.click(prevButton);

    // Wait for the component to update
    await waitFor(() => {
      expect(screen.getByText("1 citas")).toBeInTheDocument();
    });

    // Verify useAppointments was called multiple times
    expect(useAppointments).toHaveBeenCalled();

    // Verify the calls have different date ranges
    const calls = vi.mocked(useAppointments).mock.calls;
    expect(calls.length).toBeGreaterThanOrEqual(2);

    // Get first and last call to compare date ranges
    const firstCall = calls[0][0];
    const lastCall = calls[calls.length - 1][0];

    expect(lastCall?.dateRange?.[0].getTime()).toBeLessThan(
      firstCall?.dateRange?.[0].getTime() ?? 0,
    );
  });

  /**
   * Test: "Today" button returns to current week
   * Validates Requirement: 3.5
   */
  it('should return to current week when clicking "Today" button', async () => {
    const user = userEvent.setup();
    const currentWeekAppointments = [createMockAppointment({ id: "apt-1" })];
    const nextWeekAppointments = [createMockAppointment({ id: "apt-2" })];

    vi.mocked(useAppointments).mockReturnValue({
      data: currentWeekAppointments,
      isLoading: false,
      error: null,
      isError: false,
      isSuccess: true,
      refetch: vi.fn(),
    } as unknown as UseQueryResult<AppointmentReadModel[], Error>);

    renderWithProviders(<AppointmentsCalendar />);

    // Update mock for next week
    vi.mocked(useAppointments).mockReturnValue({
      data: nextWeekAppointments,
      isLoading: false,
      error: null,
      isError: false,
      isSuccess: true,
      refetch: vi.fn(),
    } as unknown as UseQueryResult<AppointmentReadModel[], Error>);

    // Navigate to next week
    const nextButton = screen.getByRole("button", { name: /siguiente/i });
    await user.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText("1 citas")).toBeInTheDocument();
    });

    // Update mock back to current week
    vi.mocked(useAppointments).mockReturnValue({
      data: currentWeekAppointments,
      isLoading: false,
      error: null,
      isError: false,
      isSuccess: true,
      refetch: vi.fn(),
    } as unknown as UseQueryResult<AppointmentReadModel[], Error>);

    // Click "Today" button
    const todayButton = screen.getByRole("button", { name: /hoy/i });
    await user.click(todayButton);

    await waitFor(() => {
      expect(screen.getByText("1 citas")).toBeInTheDocument();
    });

    // Verify useAppointments was called multiple times
    const calls = vi.mocked(useAppointments).mock.calls;
    expect(calls.length).toBeGreaterThanOrEqual(3);

    // Verify the third call returns to current week
    const firstCall = calls[0][0];
    const lastCall = calls[calls.length - 1][0];

    // The date ranges should be similar (within same week)
    const firstStart = firstCall?.dateRange?.[0].getTime() ?? 0;
    const lastStart = lastCall?.dateRange?.[0].getTime() ?? 0;
    const timeDiff = Math.abs(firstStart - lastStart);

    // Should be within 7 days (one week)
    expect(timeDiff).toBeLessThan(7 * 24 * 60 * 60 * 1000);
  });

  /**
   * Test: Filters apply correctly to calendar
   * Validates Requirements: 8.1, 8.2
   */
  it("should apply filters correctly to calendar appointments", async () => {
    const mockAppointments = [
      createMockAppointment({
        id: "apt-1",
        status: "CONFIRMED",
        offeringId: "off-1",
      }),
      createMockAppointment({
        id: "apt-2",
        status: "CONFIRMED",
        offeringId: "off-1",
      }),
    ];

    // Mock filter hook with active filters
    vi.mocked(filterHook.useAppointmentFilters).mockReturnValue({
      status: "CONFIRMED",
      offeringId: "off-1",
      dateRange: null,
      dateRangePreset: "custom",
      setStatus: mockSetStatus,
      setOfferingId: mockSetOfferingId,
      setDateRange: mockSetDateRange,
      setDateRangePreset: mockSetDateRangePreset,
      reset: mockReset,
    });

    vi.mocked(useAppointments).mockReturnValue({
      data: mockAppointments,
      isLoading: false,
      error: null,
      isError: false,
      isSuccess: true,
      refetch: vi.fn(),
    } as unknown as UseQueryResult<AppointmentReadModel[], Error>);

    renderWithProviders(<AppointmentsCalendar />);

    // Verify useAppointments was called with filters
    await waitFor(() => {
      expect(useAppointments).toHaveBeenCalledWith(
        expect.objectContaining({
          dateRange: expect.any(Array),
          status: "CONFIRMED",
          offeringId: "off-1",
        }),
      );
    });

    // Verify filtered appointment count
    expect(screen.getByText("2 citas")).toBeInTheDocument();
  });

  /**
   * Test: Appointment count updates with filters
   * Validates Requirement: 8.4
   */
  it("should update appointment count when filters change", async () => {
    const allAppointments = [
      createMockAppointment({ id: "apt-1", status: "CONFIRMED" }),
      createMockAppointment({ id: "apt-2", status: "CONFIRMED" }),
      createMockAppointment({ id: "apt-3", status: "CANCELLED" }),
    ];

    const confirmedAppointments = allAppointments.filter(
      (apt) => apt.status === "CONFIRMED",
    );

    // Initial render with no filters
    vi.mocked(useAppointments).mockReturnValueOnce({
      data: allAppointments,
      isLoading: false,
      error: null,
      isError: false,
      isSuccess: true,
      refetch: vi.fn(),
    } as unknown as UseQueryResult<AppointmentReadModel[], Error>);

    const { rerender } = renderWithProviders(<AppointmentsCalendar />);

    // Verify initial count (all appointments)
    await waitFor(() => {
      expect(screen.getByText("3 citas")).toBeInTheDocument();
    });

    // Update filter hook to return status filter
    vi.mocked(filterHook.useAppointmentFilters).mockReturnValue({
      status: "CONFIRMED",
      offeringId: null,
      dateRange: null,
      dateRangePreset: "custom",
      setStatus: mockSetStatus,
      setOfferingId: mockSetOfferingId,
      setDateRange: mockSetDateRange,
      setDateRangePreset: mockSetDateRangePreset,
      reset: mockReset,
    });

    // Mock filtered results
    vi.mocked(useAppointments).mockReturnValueOnce({
      data: confirmedAppointments,
      isLoading: false,
      error: null,
      isError: false,
      isSuccess: true,
      refetch: vi.fn(),
    } as unknown as UseQueryResult<AppointmentReadModel[], Error>);

    // Re-render with new filter
    rerender(
      <MantineProvider>
        <QueryClientProvider client={queryClient}>
          <AppointmentsCalendar />
        </QueryClientProvider>
      </MantineProvider>,
    );

    // Verify updated count (filtered appointments)
    await waitFor(() => {
      expect(screen.getByText("2 citas")).toBeInTheDocument();
    });
  });
});

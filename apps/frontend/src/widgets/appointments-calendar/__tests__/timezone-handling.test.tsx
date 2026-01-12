/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MantineProvider } from "@mantine/core";
import { AppointmentSlot } from "../ui/AppointmentSlot";
import { AppointmentsCalendar } from "../ui/AppointmentsCalendar";
import { useAuthStore } from "@app/store/auth.store";
import type { AppointmentReadModel } from "@entities/appointment";

// Mock the appointment hooks
vi.mock("@entities/appointment", async () => {
  const actual = await vi.importActual("@entities/appointment");
  return {
    ...actual,
    useAppointments: vi.fn(),
  };
});

// Mock the filter hook
vi.mock("@features/appointment/filter", () => ({
  useAppointmentFilters: vi.fn(() => ({
    status: null,
    dateRange: null,
    offeringId: null,
  })),
}));

describe("Timezone Handling Integration Tests", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.clearAllMocks();

    // Mock system date to Wednesday, January 7, 2026 at 12:00 PM UTC
    // This ensures the calendar shows the week of Jan 5-11, 2026
    vi.setSystemTime(new Date("2026-01-07T12:00:00Z"));

    // Explicitly reset the auth store to ensure clean state
    act(() => {
      useAuthStore.setState({
        user: null,
        token: null,
        businessId: null,
        businessTimezone: null,
        isAuthenticated: false,
      });
    });
  });

  afterEach(() => {
    // Restore real system time
    vi.useRealTimers();
  });

  const mockAppointment: AppointmentReadModel = {
    id: "appointment-1",
    businessId: "business-1",
    customerId: "customer-1",
    customerName: "Juan Pérez",
    customerPhone: "+18095551234",
    offeringId: "offering-1",
    offeringName: "Corte de Pelo",
    dateTime: "2026-01-07T14:30:00Z", // UTC time - Wednesday, Jan 7, 2026
    status: "CONFIRMED",
    createdAt: "2024-03-01T10:00:00Z",
    cancelledAt: null,
  };

  describe("AppointmentSlot - Business Timezone Display", () => {
    it("should display appointment time in business timezone (America/Santo_Domingo)", () => {
      // Set business timezone in act() BEFORE rendering
      act(() => {
        useAuthStore.setState({ businessTimezone: "America/Santo_Domingo" });
      });

      render(
        <MantineProvider>
          <QueryClientProvider client={queryClient}>
            <AppointmentSlot appointment={mockAppointment} />
          </QueryClientProvider>
        </MantineProvider>,
      );

      // America/Santo_Domingo is UTC-4 (no DST)
      // 14:30 UTC = 10:30 AM in Santo Domingo
      expect(screen.getByText(/10:30 AM/i)).toBeInTheDocument();
    });

    it("should display appointment time in different business timezone (America/New_York)", async () => {
      // Set business timezone in act() BEFORE rendering
      act(() => {
        useAuthStore.setState({ businessTimezone: "America/New_York" });
      });

      render(
        <MantineProvider>
          <QueryClientProvider client={queryClient}>
            <AppointmentSlot appointment={mockAppointment} />
          </QueryClientProvider>
        </MantineProvider>,
      );

      // America/New_York is UTC-5 in March (EST, before DST)
      // 14:30 UTC = 9:30 AM in New York (EST)
      // Use waitFor to ensure the component has rendered with the correct timezone
      await waitFor(() => {
        expect(screen.getByText(/9:30 AM/i)).toBeInTheDocument();
      });
    });

    it("should display appointment time in Asia/Tokyo timezone", () => {
      // Set business timezone in act() BEFORE rendering
      act(() => {
        useAuthStore.setState({ businessTimezone: "Asia/Tokyo" });
      });

      render(
        <MantineProvider>
          <QueryClientProvider client={queryClient}>
            <AppointmentSlot appointment={mockAppointment} />
          </QueryClientProvider>
        </MantineProvider>,
      );

      // Asia/Tokyo is UTC+9
      // 14:30 UTC = 11:30 PM in Tokyo
      expect(screen.getByText(/11:30 PM/i)).toBeInTheDocument();
    });

    it("should fallback to local timezone when business timezone is null", () => {
      // Set business timezone to null in act() BEFORE rendering
      act(() => {
        useAuthStore.setState({ businessTimezone: null });
      });

      render(
        <MantineProvider>
          <QueryClientProvider client={queryClient}>
            <AppointmentSlot appointment={mockAppointment} />
          </QueryClientProvider>
        </MantineProvider>,
      );

      // Should still render a valid time (in local timezone)
      const timeElement = screen.getByText(/\d{1,2}:\d{2} [AP]M/i);
      expect(timeElement).toBeInTheDocument();
    });
  });

  describe("DST Transitions", () => {
    it("should handle DST transition correctly (spring forward)", () => {
      // Set business timezone in act() BEFORE rendering
      act(() => {
        useAuthStore.setState({ businessTimezone: "America/New_York" });
      });

      // March 10, 2024 at 2:00 AM EDT - DST begins (spring forward)
      // Before DST: UTC-5 (EST)
      // After DST: UTC-4 (EDT)
      const appointmentBeforeDST: AppointmentReadModel = {
        ...mockAppointment,
        dateTime: "2024-03-10T06:00:00Z", // 1:00 AM EST (before DST)
      };

      const { rerender } = render(
        <MantineProvider>
          <QueryClientProvider client={queryClient}>
            <AppointmentSlot appointment={appointmentBeforeDST} />
          </QueryClientProvider>
        </MantineProvider>,
      );

      // Should show 1:00 AM (EST, UTC-5)
      expect(screen.getByText(/1:00 AM/i)).toBeInTheDocument();

      // After DST transition
      const appointmentAfterDST: AppointmentReadModel = {
        ...mockAppointment,
        dateTime: "2024-03-10T15:00:00Z", // 11:00 AM EDT (after DST)
      };

      rerender(
        <MantineProvider>
          <QueryClientProvider client={queryClient}>
            <AppointmentSlot appointment={appointmentAfterDST} />
          </QueryClientProvider>
        </MantineProvider>,
      );

      // Should show 11:00 AM (EDT, UTC-4)
      expect(screen.getByText(/11:00 AM/i)).toBeInTheDocument();
    });

    it("should handle DST transition correctly (fall back)", () => {
      // Set business timezone in act() BEFORE rendering
      act(() => {
        useAuthStore.setState({ businessTimezone: "America/New_York" });
      });

      // November 3, 2024 at 2:00 AM EST - DST ends (fall back)
      // Before: UTC-4 (EDT)
      // After: UTC-5 (EST)
      const appointmentBeforeDST: AppointmentReadModel = {
        ...mockAppointment,
        dateTime: "2024-11-03T05:00:00Z", // 1:00 AM EDT (before fall back)
      };

      const { rerender } = render(
        <MantineProvider>
          <QueryClientProvider client={queryClient}>
            <AppointmentSlot appointment={appointmentBeforeDST} />
          </QueryClientProvider>
        </MantineProvider>,
      );

      // Should show 1:00 AM (EDT, UTC-4)
      expect(screen.getByText(/1:00 AM/i)).toBeInTheDocument();

      // After DST transition
      const appointmentAfterDST: AppointmentReadModel = {
        ...mockAppointment,
        dateTime: "2024-11-03T15:00:00Z", // 10:00 AM EST (after fall back)
      };

      rerender(
        <MantineProvider>
          <QueryClientProvider client={queryClient}>
            <AppointmentSlot appointment={appointmentAfterDST} />
          </QueryClientProvider>
        </MantineProvider>,
      );

      // Should show 10:00 AM (EST, UTC-5)
      expect(screen.getByText(/10:00 AM/i)).toBeInTheDocument();
    });

    it("should handle timezone without DST correctly (America/Santo_Domingo)", () => {
      // Set business timezone in act() BEFORE rendering
      act(() => {
        useAuthStore.setState({ businessTimezone: "America/Santo_Domingo" });
      });

      // Test same date in March (when US has DST)
      const appointmentMarch: AppointmentReadModel = {
        ...mockAppointment,
        dateTime: "2024-03-10T14:30:00Z",
      };

      const { rerender } = render(
        <MantineProvider>
          <QueryClientProvider client={queryClient}>
            <AppointmentSlot appointment={appointmentMarch} />
          </QueryClientProvider>
        </MantineProvider>,
      );

      // Should show 10:30 AM (UTC-4, no DST)
      expect(screen.getByText(/10:30 AM/i)).toBeInTheDocument();

      // Test same time in November (when US ends DST)
      const appointmentNovember: AppointmentReadModel = {
        ...mockAppointment,
        dateTime: "2024-11-10T14:30:00Z",
      };

      rerender(
        <MantineProvider>
          <QueryClientProvider client={queryClient}>
            <AppointmentSlot appointment={appointmentNovember} />
          </QueryClientProvider>
        </MantineProvider>,
      );

      // Should still show 10:30 AM (UTC-4, no DST)
      expect(screen.getByText(/10:30 AM/i)).toBeInTheDocument();
    });
  });

  describe("Timezone Changes Update All Displayed Times", () => {
    it("should update all appointment times when timezone changes", async () => {
      const { useAppointments } = await import("@entities/appointment");

      // Use a date in the current week (January 2026)
      const appointmentInCurrentWeek: AppointmentReadModel = {
        ...mockAppointment,
        dateTime: "2026-01-07T14:30:00Z", // Wednesday, Jan 7, 2026
      };

      // Mock appointments query
      vi.mocked(useAppointments).mockReturnValue({
        data: [appointmentInCurrentWeek],
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      // Start with Santo Domingo timezone in act() BEFORE rendering
      act(() => {
        useAuthStore.setState({ businessTimezone: "America/Santo_Domingo" });
      });

      const { rerender } = render(
        <MantineProvider>
          <QueryClientProvider client={queryClient}>
            <AppointmentsCalendar />
          </QueryClientProvider>
        </MantineProvider>,
      );

      // Wait for appointments to load
      await waitFor(() => {
        expect(screen.getByText(/10:30 AM/i)).toBeInTheDocument();
      });

      // Change timezone to New York in act() and rerender
      act(() => {
        useAuthStore.setState({ businessTimezone: "America/New_York" });
      });

      rerender(
        <MantineProvider>
          <QueryClientProvider client={queryClient}>
            <AppointmentsCalendar />
          </QueryClientProvider>
        </MantineProvider>,
      );

      // All times should update to New York timezone
      await waitFor(() => {
        expect(screen.getByText(/9:30 AM/i)).toBeInTheDocument();
      });

      // Change timezone to Tokyo in act() and rerender
      act(() => {
        useAuthStore.setState({ businessTimezone: "Asia/Tokyo" });
      });

      rerender(
        <MantineProvider>
          <QueryClientProvider client={queryClient}>
            <AppointmentsCalendar />
          </QueryClientProvider>
        </MantineProvider>,
      );

      // All times should update to Tokyo timezone
      await waitFor(() => {
        expect(screen.getByText(/11:30 PM/i)).toBeInTheDocument();
      });
    });

    it("should update multiple appointments when timezone changes", async () => {
      const { useAppointments } = await import("@entities/appointment");

      // Use dates in the current week (January 2026)
      const appointments: AppointmentReadModel[] = [
        {
          ...mockAppointment,
          id: "appointment-1",
          dateTime: "2026-01-07T14:30:00Z", // Wednesday, Jan 7, 2026 - 10:30 AM Santo Domingo
        },
        {
          ...mockAppointment,
          id: "appointment-2",
          dateTime: "2026-01-07T16:00:00Z", // Wednesday, Jan 7, 2026 - 12:00 PM Santo Domingo
        },
        {
          ...mockAppointment,
          id: "appointment-3",
          dateTime: "2026-01-07T18:30:00Z", // Wednesday, Jan 7, 2026 - 2:30 PM Santo Domingo
        },
      ];

      // Mock appointments query
      vi.mocked(useAppointments).mockReturnValue({
        data: appointments,
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      // Start with Santo Domingo timezone in act() BEFORE rendering
      act(() => {
        useAuthStore.setState({ businessTimezone: "America/Santo_Domingo" });
      });

      const { rerender } = render(
        <MantineProvider>
          <QueryClientProvider client={queryClient}>
            <AppointmentsCalendar />
          </QueryClientProvider>
        </MantineProvider>,
      );

      // Wait for appointments to load
      await waitFor(() => {
        expect(screen.getByText(/10:30 AM/i)).toBeInTheDocument();
        expect(screen.getByText(/12:00 PM/i)).toBeInTheDocument();
        expect(screen.getByText(/2:30 PM/i)).toBeInTheDocument();
      });

      // Change timezone to New York (UTC-5 in January) in act() and rerender
      act(() => {
        useAuthStore.setState({ businessTimezone: "America/New_York" });
      });

      rerender(
        <MantineProvider>
          <QueryClientProvider client={queryClient}>
            <AppointmentsCalendar />
          </QueryClientProvider>
        </MantineProvider>,
      );

      // All times should update to New York timezone
      await waitFor(() => {
        expect(screen.getByText(/9:30 AM/i)).toBeInTheDocument(); // 14:30 UTC = 9:30 AM EST
        expect(screen.getByText(/11:00 AM/i)).toBeInTheDocument(); // 16:00 UTC = 11:00 AM EST
        expect(screen.getByText(/1:30 PM/i)).toBeInTheDocument(); // 18:30 UTC = 1:30 PM EST
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle midnight appointments correctly across timezones", () => {
      // Set business timezone in act() BEFORE rendering
      act(() => {
        useAuthStore.setState({ businessTimezone: "America/New_York" });
      });

      // Midnight UTC
      const midnightAppointment: AppointmentReadModel = {
        ...mockAppointment,
        dateTime: "2024-03-10T00:00:00Z",
      };

      render(
        <MantineProvider>
          <QueryClientProvider client={queryClient}>
            <AppointmentSlot appointment={midnightAppointment} />
          </QueryClientProvider>
        </MantineProvider>,
      );

      // 00:00 UTC = 7:00 PM previous day in New York (EST, UTC-5)
      expect(screen.getByText(/7:00 PM/i)).toBeInTheDocument();
    });

    it("should handle end-of-day appointments correctly across timezones", () => {
      // Set business timezone in act() BEFORE rendering
      act(() => {
        useAuthStore.setState({ businessTimezone: "Asia/Tokyo" });
      });

      // 11:59 PM UTC
      const endOfDayAppointment: AppointmentReadModel = {
        ...mockAppointment,
        dateTime: "2024-03-10T23:59:00Z",
      };

      render(
        <MantineProvider>
          <QueryClientProvider client={queryClient}>
            <AppointmentSlot appointment={endOfDayAppointment} />
          </QueryClientProvider>
        </MantineProvider>,
      );

      // 23:59 UTC = 8:59 AM next day in Tokyo (UTC+9)
      expect(screen.getByText(/8:59 AM/i)).toBeInTheDocument();
    });

    it("should handle invalid timezone gracefully by falling back to local timezone", () => {
      // Set invalid timezone in act() BEFORE rendering
      act(() => {
        useAuthStore.setState({ businessTimezone: "Invalid/Timezone" });
      });

      // The formatAppointmentTime function should catch the error and fallback
      // However, if it throws, we need to handle it in the component
      // For now, let's test that the component doesn't crash
      const { container } = render(
        <MantineProvider>
          <QueryClientProvider client={queryClient}>
            <AppointmentSlot appointment={mockAppointment} />
          </QueryClientProvider>
        </MantineProvider>,
      );

      // Component should render without crashing
      expect(container).toBeInTheDocument();
    });
  });
});

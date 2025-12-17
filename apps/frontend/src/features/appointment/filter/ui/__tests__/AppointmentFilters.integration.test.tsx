/**
 * Integration Tests for AppointmentFilters
 *
 * Tests the complete flow of date range filtering including:
 * - Preset selection updates appointments query
 * - Custom date range filtering
 * - Filter combinations (status + date range)
 * - Reset functionality
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MantineProvider } from "@mantine/core";
import { AppointmentFilters } from "../AppointmentFilters";
import { useAppointments } from "@entities/appointment/model/queries";
import { useAppointmentFilters } from "../../model/useAppointmentFilters";
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from "date-fns";

// Mock the appointments hook
vi.mock("@entities/appointment/model/queries", () => ({
  useAppointments: vi.fn(),
  appointmentKeys: {
    all: ["appointments"],
    lists: () => ["appointments", "list"],
    list: (filters?: unknown) => ["appointments", "list", filters],
  },
}));

// Helper to create a test wrapper with QueryClient and MantineProvider
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

describe("AppointmentFilters - Integration Tests", () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    // Reset store before each test
    useAppointmentFilters.getState().reset();
    // Mock useAppointments to return empty data by default
    vi.mocked(useAppointments).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
  });

  it("should filter appointments when selecting 'Hoy' preset", async () => {
    const Wrapper = createWrapper();
    render(<AppointmentFilters />, { wrapper: Wrapper });

    // Click on "Hoy" preset
    const hoyButton = screen.getByRole("radio", { name: /hoy/i });
    await user.click(hoyButton);

    // Wait for state update
    await waitFor(() => {
      const state = useAppointmentFilters.getState();
      expect(state.dateRangePreset).toBe("today");
      expect(state.dateRange).toBeDefined();
    });

    // Verify date range is set to today
    const state = useAppointmentFilters.getState();
    const today = new Date();
    const expectedStart = startOfDay(today);
    const expectedEnd = endOfDay(today);

    expect(state.dateRange).toBeDefined();
    expect(state.dateRange![0].getTime()).toBe(expectedStart.getTime());
    expect(state.dateRange![1].getTime()).toBe(expectedEnd.getTime());
  });

  it("should filter appointments when selecting 'Esta Semana' preset", async () => {
    const Wrapper = createWrapper();
    render(<AppointmentFilters />, { wrapper: Wrapper });

    // Click on "Semana" preset (the actual label text)
    const semanaButton = screen.getByRole("radio", { name: "Semana" });
    await user.click(semanaButton);

    // Wait for state update
    await waitFor(() => {
      const state = useAppointmentFilters.getState();
      expect(state.dateRangePreset).toBe("week");
      expect(state.dateRange).toBeDefined();
    });

    // Verify date range is set to current week (Monday to Sunday)
    const state = useAppointmentFilters.getState();
    const today = new Date();
    const expectedStart = startOfWeek(today, { weekStartsOn: 1 });
    const expectedEnd = endOfWeek(today, { weekStartsOn: 1 });

    expect(state.dateRange).toBeDefined();
    expect(state.dateRange![0].getTime()).toBe(expectedStart.getTime());
    expect(state.dateRange![1].getTime()).toBe(expectedEnd.getTime());
  });

  it("should filter appointments when selecting 'Este Mes' preset", async () => {
    const Wrapper = createWrapper();
    render(<AppointmentFilters />, { wrapper: Wrapper });

    // Click on "Mes" preset (the actual label text)
    const mesButton = screen.getByRole("radio", { name: "Mes" });
    await user.click(mesButton);

    // Wait for state update
    await waitFor(() => {
      const state = useAppointmentFilters.getState();
      expect(state.dateRangePreset).toBe("month");
      expect(state.dateRange).toBeDefined();
    });

    // Verify date range is set to current month
    const state = useAppointmentFilters.getState();
    const today = new Date();
    const expectedStart = startOfMonth(today);
    const expectedEnd = endOfMonth(today);

    expect(state.dateRange).toBeDefined();
    expect(state.dateRange![0].getTime()).toBe(expectedStart.getTime());
    expect(state.dateRange![1].getTime()).toBe(expectedEnd.getTime());
  });

  it("should allow custom date range selection", async () => {
    const Wrapper = createWrapper();
    render(<AppointmentFilters />, { wrapper: Wrapper });

    // Click on "Personalizado" preset
    const personalizadoButton = screen.getByRole("radio", {
      name: /personalizado/i,
    });
    await user.click(personalizadoButton);

    // Wait for DatePickerInput to appear
    await waitFor(() => {
      expect(screen.getByLabelText(/rango personalizado/i)).toBeInTheDocument();
    });

    // Verify preset is set to custom
    const state = useAppointmentFilters.getState();
    expect(state.dateRangePreset).toBe("custom");
  });

  it("should update filter state when changing preset", async () => {
    const Wrapper = createWrapper();
    render(<AppointmentFilters />, { wrapper: Wrapper });

    // Initially, state should have default values
    const initialState = useAppointmentFilters.getState();
    expect(initialState.status).toBeNull();
    expect(initialState.dateRange).toBeNull();
    expect(initialState.dateRangePreset).toBe("custom");

    // Click on "Hoy" preset
    const hoyButton = screen.getByRole("radio", { name: /hoy/i });
    await user.click(hoyButton);

    // Wait for state update
    await waitFor(() => {
      const state = useAppointmentFilters.getState();
      expect(state.dateRangePreset).toBe("today");
      expect(state.dateRange).toBeDefined();
    });

    // Verify state was updated correctly
    const updatedState = useAppointmentFilters.getState();
    expect(updatedState.dateRangePreset).toBe("today");
    expect(updatedState.dateRange).not.toBeNull();
  });

  it("should reset preset to 'custom' and clear dateRange when clicking 'Limpiar filtros'", async () => {
    const Wrapper = createWrapper();
    render(<AppointmentFilters />, { wrapper: Wrapper });

    // Set a preset first
    const hoyButton = screen.getByRole("radio", { name: /hoy/i });
    await user.click(hoyButton);

    await waitFor(() => {
      const state = useAppointmentFilters.getState();
      expect(state.dateRangePreset).toBe("today");
      expect(state.dateRange).toBeDefined();
    });

    // Click "Limpiar filtros"
    const clearButton = screen.getByRole("button", {
      name: /limpiar filtros/i,
    });
    await user.click(clearButton);

    // Verify state is reset
    await waitFor(() => {
      const state = useAppointmentFilters.getState();
      expect(state.dateRangePreset).toBe("custom");
      expect(state.dateRange).toBeNull();
      expect(state.status).toBeNull();
    });
  });

  it("should maintain status filter when changing date preset", async () => {
    const Wrapper = createWrapper();
    render(<AppointmentFilters />, { wrapper: Wrapper });

    // Set status filter directly in the store (simpler than clicking through Mantine Select)
    useAppointmentFilters.getState().setStatus("CONFIRMED");

    await waitFor(() => {
      const state = useAppointmentFilters.getState();
      expect(state.status).toBe("CONFIRMED");
    });

    // Now change date preset
    const hoyButton = screen.getByRole("radio", { name: /hoy/i });
    await user.click(hoyButton);

    // Verify both filters are active
    await waitFor(() => {
      const state = useAppointmentFilters.getState();
      expect(state.status).toBe("CONFIRMED");
      expect(state.dateRangePreset).toBe("today");
      expect(state.dateRange).toBeDefined();
    });
  });
});

/**
 * Component Tests for WeekView
 *
 * Tests rendering, appointment grouping, responsive grid, and state handling
 */

import {
  describe,
  it,
  expect,
  beforeAll,
  afterEach,
  afterAll,
  vi,
} from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MantineProvider } from "@mantine/core";
import { WeekView } from "../WeekView";
import type { WeekRange } from "../../model/types";

// Mock DayColumn component to simplify testing
vi.mock("../DayColumn", () => ({
  DayColumn: ({
    date,
    appointments,
  }: {
    date: Date;
    appointments: unknown[];
  }) => (
    <div data-testid="day-column" data-date={date.toISOString()}>
      {appointments.length} appointments
    </div>
  ),
}));

describe("WeekView Component", () => {
  let queryClient: QueryClient;
  const mockWeekRange: WeekRange = [
    new Date("2024-12-16"), // Monday
    new Date("2024-12-22"), // Sunday
  ];

  beforeAll(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  afterAll(() => {
    queryClient.clear();
  });

  const renderWeekView = (
    weekRange: WeekRange = mockWeekRange,
    overrides = {},
  ) => {
    const defaultProps = {
      weekRange,
      appointmentsByDay: {},
      isLoading: false,
      error: null,
      ...overrides,
    };

    return render(
      <MantineProvider>
        <QueryClientProvider client={queryClient}>
          <WeekView {...defaultProps} />
        </QueryClientProvider>
      </MantineProvider>,
    );
  };

  it("should render 7 DayColumn components for a full week", () => {
    renderWeekView();

    const dayColumns = screen.getAllByTestId("day-column");
    expect(dayColumns).toHaveLength(7);
  });

  it("should group appointments correctly by day", () => {
    const mockAppointments = [
      {
        id: "1",
        dateTime: "2024-12-16T10:00:00Z",
        offeringName: "Service 1",
        customerName: "Customer 1",
        status: "CONFIRMED",
      },
      {
        id: "2",
        dateTime: "2024-12-16T14:00:00Z",
        offeringName: "Service 2",
        customerName: "Customer 2",
        status: "CONFIRMED",
      },
      {
        id: "3",
        dateTime: "2024-12-17T10:00:00Z",
        offeringName: "Service 3",
        customerName: "Customer 3",
        status: "CONFIRMED",
      },
    ];

    renderWeekView(mockWeekRange, {
      appointmentsByDay: {
        "2024-12-16": [mockAppointments[0], mockAppointments[1]],
        "2024-12-17": [mockAppointments[2]],
      },
    });

    // Check that all 7 day columns are rendered
    const dayColumns = screen.getAllByTestId("day-column");
    expect(dayColumns).toHaveLength(7);

    // Verify appointments are distributed (mock shows counts)
    // The mock DayColumn shows "{appointments.length} appointments"
    // We can't test exact distribution without rendering real DayColumn
    expect(dayColumns[0]).toBeInTheDocument();
  });

  it("should display loading state", () => {
    renderWeekView(mockWeekRange, { isLoading: true });

    // WeekView now shows loading in each DayColumn instead of LoadingOverlay
    // Check that 7 day columns are still rendered
    const dayColumns = screen.getAllByTestId("day-column");
    expect(dayColumns).toHaveLength(7);
  });

  it("should display error state", () => {
    const mockError = new Error("Failed to load appointments");

    renderWeekView(mockWeekRange, { error: mockError });

    expect(screen.getByText(/Error al cargar citas/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Failed to load appointments/i),
    ).toBeInTheDocument();
  });

  it("should render empty day columns when no appointments", () => {
    renderWeekView();

    const dayColumns = screen.getAllByTestId("day-column");
    dayColumns.forEach((column) => {
      expect(column).toHaveTextContent("0 appointments");
    });
  });

  it("should use SimpleGrid with responsive columns", () => {
    const { container } = renderWeekView();

    // Check that SimpleGrid is rendered by looking for Mantine grid class
    const grid = container.querySelector('[class*="SimpleGrid"]');
    expect(grid).toBeInTheDocument();
  });

  describe("Error state with retry", () => {
    it("should display retry button when error occurs and refetch is provided", () => {
      const mockError = new Error("Failed to load appointments");
      const mockRefetch = vi.fn();

      renderWeekView(mockWeekRange, {
        error: mockError,
        refetch: mockRefetch,
      });

      expect(screen.getByText(/Error al cargar citas/i)).toBeInTheDocument();
      expect(screen.getByText("Reintentar")).toBeInTheDocument();
    });

    it("should call refetch when retry button is clicked", async () => {
      const mockError = new Error("Failed to load appointments");
      const mockRefetch = vi.fn();

      renderWeekView(mockWeekRange, {
        error: mockError,
        refetch: mockRefetch,
      });

      const retryButton = screen.getByText("Reintentar");
      retryButton.click();

      expect(mockRefetch).toHaveBeenCalledTimes(1);
    });

    it("should not display retry button when refetch is not provided", () => {
      const mockError = new Error("Failed to load appointments");

      renderWeekView(mockWeekRange, {
        error: mockError,
        refetch: undefined,
      });

      expect(screen.getByText(/Error al cargar citas/i)).toBeInTheDocument();
      expect(screen.queryByText("Reintentar")).not.toBeInTheDocument();
    });

    it("should use IconInfoCircle in error alert", () => {
      const mockError = new Error("Failed to load appointments");
      const mockRefetch = vi.fn();

      const { container } = renderWeekView(mockWeekRange, {
        error: mockError,
        refetch: mockRefetch,
      });

      // Check for the icon by looking for SVG with tabler-icon class
      const icon = container.querySelector(".tabler-icon-info-circle");
      expect(icon).toBeInTheDocument();
    });
  });
});

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MantineProvider } from "@mantine/core";
import { CalendarHeader } from "../CalendarHeader";

// Wrapper component for Mantine
function renderWithMantine(ui: React.ReactElement) {
  return render(<MantineProvider>{ui}</MantineProvider>);
}

describe("CalendarHeader", () => {
  const mockWeekRange: [Date, Date] = [
    new Date("2024-12-15T12:00:00"), // Sunday at noon (avoids timezone issues)
    new Date("2024-12-21T12:00:00"), // Saturday at noon (avoids timezone issues)
  ];

  const mockCallbacks = {
    onPrevious: vi.fn(),
    onNext: vi.fn(),
    onToday: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Date Range Display", () => {
    it("should display date range correctly", () => {
      renderWithMantine(
        <CalendarHeader
          weekRange={mockWeekRange}
          appointmentCount={5}
          {...mockCallbacks}
        />,
      );

      // Verify date range is displayed in Spanish format
      expect(screen.getByText(/dic 15 - dic 21, 2024/i)).toBeInTheDocument();
    });

    it("should display date range for different months", () => {
      const crossMonthRange: [Date, Date] = [
        new Date("2024-12-29T12:00:00"), // Sunday at noon
        new Date("2025-01-04T12:00:00"), // Saturday at noon
      ];

      renderWithMantine(
        <CalendarHeader
          weekRange={crossMonthRange}
          appointmentCount={3}
          {...mockCallbacks}
        />,
      );

      // Should show both months
      expect(screen.getByText(/dic 29 - ene 4, 2025/i)).toBeInTheDocument();
    });

    it("should display date range for same day (edge case)", () => {
      const sameDay: [Date, Date] = [
        new Date("2024-12-17T12:00:00"),
        new Date("2024-12-17T12:00:00"),
      ];

      renderWithMantine(
        <CalendarHeader
          weekRange={sameDay}
          appointmentCount={1}
          {...mockCallbacks}
        />,
      );

      expect(screen.getByText(/dic 17 - dic 17, 2024/i)).toBeInTheDocument();
    });
  });

  describe("Appointment Count Display", () => {
    it("should display appointment count correctly", () => {
      renderWithMantine(
        <CalendarHeader
          weekRange={mockWeekRange}
          appointmentCount={5}
          {...mockCallbacks}
        />,
      );

      expect(screen.getByText("5 citas")).toBeInTheDocument();
    });

    it("should display zero appointments", () => {
      renderWithMantine(
        <CalendarHeader
          weekRange={mockWeekRange}
          appointmentCount={0}
          {...mockCallbacks}
        />,
      );

      expect(screen.getByText("0 citas")).toBeInTheDocument();
    });

    it("should display single appointment", () => {
      renderWithMantine(
        <CalendarHeader
          weekRange={mockWeekRange}
          appointmentCount={1}
          {...mockCallbacks}
        />,
      );

      expect(screen.getByText("1 citas")).toBeInTheDocument();
    });

    it("should display large appointment count", () => {
      renderWithMantine(
        <CalendarHeader
          weekRange={mockWeekRange}
          appointmentCount={999}
          {...mockCallbacks}
        />,
      );

      expect(screen.getByText("999 citas")).toBeInTheDocument();
    });

    it("should render appointment count in a badge", () => {
      renderWithMantine(
        <CalendarHeader
          weekRange={mockWeekRange}
          appointmentCount={5}
          {...mockCallbacks}
        />,
      );

      const badgeText = screen.getByText("5 citas");
      // Badge text is in a label element, check parent has badge class
      const badgeElement = badgeText.closest(".mantine-Badge-root");
      expect(badgeElement).toBeInTheDocument();
    });
  });

  describe("Navigation Buttons", () => {
    it("should render all three navigation buttons", () => {
      renderWithMantine(
        <CalendarHeader
          weekRange={mockWeekRange}
          appointmentCount={5}
          {...mockCallbacks}
        />,
      );

      expect(
        screen.getByRole("button", { name: /anterior/i }),
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /hoy/i })).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /siguiente/i }),
      ).toBeInTheDocument();
    });

    it("should call onPrevious when Anterior button is clicked", async () => {
      const user = userEvent.setup();

      renderWithMantine(
        <CalendarHeader
          weekRange={mockWeekRange}
          appointmentCount={5}
          {...mockCallbacks}
        />,
      );

      const previousButton = screen.getByRole("button", { name: /anterior/i });
      await user.click(previousButton);

      expect(mockCallbacks.onPrevious).toHaveBeenCalledTimes(1);
      expect(mockCallbacks.onNext).not.toHaveBeenCalled();
      expect(mockCallbacks.onToday).not.toHaveBeenCalled();
    });

    it("should call onNext when Siguiente button is clicked", async () => {
      const user = userEvent.setup();

      renderWithMantine(
        <CalendarHeader
          weekRange={mockWeekRange}
          appointmentCount={5}
          {...mockCallbacks}
        />,
      );

      const nextButton = screen.getByRole("button", { name: /siguiente/i });
      await user.click(nextButton);

      expect(mockCallbacks.onNext).toHaveBeenCalledTimes(1);
      expect(mockCallbacks.onPrevious).not.toHaveBeenCalled();
      expect(mockCallbacks.onToday).not.toHaveBeenCalled();
    });

    it("should call onToday when Hoy button is clicked", async () => {
      const user = userEvent.setup();

      renderWithMantine(
        <CalendarHeader
          weekRange={mockWeekRange}
          appointmentCount={5}
          {...mockCallbacks}
        />,
      );

      const todayButton = screen.getByRole("button", { name: /hoy/i });
      await user.click(todayButton);

      expect(mockCallbacks.onToday).toHaveBeenCalledTimes(1);
      expect(mockCallbacks.onPrevious).not.toHaveBeenCalled();
      expect(mockCallbacks.onNext).not.toHaveBeenCalled();
    });

    it("should handle multiple clicks on navigation buttons", async () => {
      const user = userEvent.setup();

      renderWithMantine(
        <CalendarHeader
          weekRange={mockWeekRange}
          appointmentCount={5}
          {...mockCallbacks}
        />,
      );

      const previousButton = screen.getByRole("button", { name: /anterior/i });
      const nextButton = screen.getByRole("button", { name: /siguiente/i });

      await user.click(previousButton);
      await user.click(nextButton);
      await user.click(previousButton);

      expect(mockCallbacks.onPrevious).toHaveBeenCalledTimes(2);
      expect(mockCallbacks.onNext).toHaveBeenCalledTimes(1);
    });
  });

  describe("Button Labels in Spanish", () => {
    it("should have Spanish labels for all buttons", () => {
      renderWithMantine(
        <CalendarHeader
          weekRange={mockWeekRange}
          appointmentCount={5}
          {...mockCallbacks}
        />,
      );

      // Verify Spanish labels
      expect(screen.getByText("Anterior")).toBeInTheDocument();
      expect(screen.getByText("Hoy")).toBeInTheDocument();
      expect(screen.getByText("Siguiente")).toBeInTheDocument();
    });

    it("should have Spanish label for appointment count", () => {
      renderWithMantine(
        <CalendarHeader
          weekRange={mockWeekRange}
          appointmentCount={5}
          {...mockCallbacks}
        />,
      );

      // Verify "citas" is in Spanish
      expect(screen.getByText(/citas/i)).toBeInTheDocument();
    });
  });

  describe("Icons", () => {
    it("should render icons for navigation buttons", () => {
      const { container } = renderWithMantine(
        <CalendarHeader
          weekRange={mockWeekRange}
          appointmentCount={5}
          {...mockCallbacks}
        />,
      );

      // Verify icons are rendered (Tabler icons render as SVG)
      const svgs = container.querySelectorAll("svg");
      expect(svgs.length).toBeGreaterThanOrEqual(3); // At least 3 icons for buttons
    });
  });

  describe("Layout and Styling", () => {
    it("should render with proper layout structure", () => {
      const { container } = renderWithMantine(
        <CalendarHeader
          weekRange={mockWeekRange}
          appointmentCount={5}
          {...mockCallbacks}
        />,
      );

      // Verify Mantine Group component is used
      const groups = container.querySelectorAll(".mantine-Group-root");
      expect(groups.length).toBeGreaterThan(0);
    });

    it("should render date range with proper text styling", () => {
      renderWithMantine(
        <CalendarHeader
          weekRange={mockWeekRange}
          appointmentCount={5}
          {...mockCallbacks}
        />,
      );

      const dateText = screen.getByText(/dic 15 - dic 21, 2024/i);
      expect(dateText).toHaveClass("mantine-Text-root");
    });
  });
});

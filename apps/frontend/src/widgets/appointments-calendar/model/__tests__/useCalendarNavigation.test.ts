import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCalendarNavigation } from "../useCalendarNavigation";
import { format, differenceInDays } from "date-fns";

describe("useCalendarNavigation", () => {
  beforeEach(() => {
    // Mock Date to have consistent "today" for tests
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-12-18")); // Wednesday, Dec 18, 2024
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("initial state", () => {
    it("should initialize with current week", () => {
      const { result } = renderHook(() => useCalendarNavigation());
      const [start, end] = result.current.currentWeek;

      // Week should start on Monday Dec 16
      expect(format(start, "yyyy-MM-dd")).toBe("2024-12-16");
      // Week should end on Sunday Dec 22
      expect(format(end, "yyyy-MM-dd")).toBe("2024-12-22");
    });

    it("should initialize with current date", () => {
      const { result } = renderHook(() => useCalendarNavigation());
      const today = new Date();

      expect(format(result.current.currentDate, "yyyy-MM-dd")).toBe(
        format(today, "yyyy-MM-dd"),
      );
    });

    it("should return a week that is 7 days long", () => {
      const { result } = renderHook(() => useCalendarNavigation());
      const [start, end] = result.current.currentWeek;

      const dayCount = differenceInDays(end, start) + 1;
      expect(dayCount).toBe(7);
    });
  });

  describe("goToPreviousWeek", () => {
    it("should navigate to previous week (7 days earlier)", () => {
      const { result } = renderHook(() => useCalendarNavigation());
      const [initialStart, initialEnd] = result.current.currentWeek;

      act(() => {
        result.current.goToPreviousWeek();
      });

      const [newStart, newEnd] = result.current.currentWeek;

      // Should be 7 days earlier
      expect(format(newStart, "yyyy-MM-dd")).toBe("2024-12-09"); // Monday
      expect(format(newEnd, "yyyy-MM-dd")).toBe("2024-12-15"); // Sunday

      // Verify it's exactly 7 days earlier
      expect(differenceInDays(initialStart, newStart)).toBe(7);
      expect(differenceInDays(initialEnd, newEnd)).toBe(7);
    });

    it("should handle multiple consecutive previous week navigations", () => {
      const { result } = renderHook(() => useCalendarNavigation());

      act(() => {
        result.current.goToPreviousWeek();
      });
      const [week1Start] = result.current.currentWeek;

      act(() => {
        result.current.goToPreviousWeek();
      });
      const [week2Start] = result.current.currentWeek;

      act(() => {
        result.current.goToPreviousWeek();
      });
      const [week3Start] = result.current.currentWeek;

      // Each navigation should move exactly 7 days
      expect(differenceInDays(week1Start, week2Start)).toBe(7);
      expect(differenceInDays(week2Start, week3Start)).toBe(7);
    });

    it("should handle year boundary correctly", () => {
      vi.setSystemTime(new Date("2025-01-02")); // Thursday, Jan 2, 2025

      const { result } = renderHook(() => useCalendarNavigation());

      act(() => {
        result.current.goToPreviousWeek();
      });

      const [newStart, newEnd] = result.current.currentWeek;

      // Should cross into previous year
      expect(format(newStart, "yyyy-MM-dd")).toBe("2024-12-23"); // Monday
      expect(format(newEnd, "yyyy-MM-dd")).toBe("2024-12-29"); // Sunday
    });
  });

  describe("goToNextWeek", () => {
    it("should navigate to next week (7 days later)", () => {
      const { result } = renderHook(() => useCalendarNavigation());
      const [initialStart, initialEnd] = result.current.currentWeek;

      act(() => {
        result.current.goToNextWeek();
      });

      const [newStart, newEnd] = result.current.currentWeek;

      // Should be 7 days later
      expect(format(newStart, "yyyy-MM-dd")).toBe("2024-12-23"); // Monday
      expect(format(newEnd, "yyyy-MM-dd")).toBe("2024-12-29"); // Sunday

      // Verify it's exactly 7 days later
      expect(differenceInDays(newStart, initialStart)).toBe(7);
      expect(differenceInDays(newEnd, initialEnd)).toBe(7);
    });

    it("should handle multiple consecutive next week navigations", () => {
      const { result } = renderHook(() => useCalendarNavigation());

      act(() => {
        result.current.goToNextWeek();
      });
      const [week1Start] = result.current.currentWeek;

      act(() => {
        result.current.goToNextWeek();
      });
      const [week2Start] = result.current.currentWeek;

      act(() => {
        result.current.goToNextWeek();
      });
      const [week3Start] = result.current.currentWeek;

      // Each navigation should move exactly 7 days
      expect(differenceInDays(week2Start, week1Start)).toBe(7);
      expect(differenceInDays(week3Start, week2Start)).toBe(7);
    });

    it("should handle year boundary correctly", () => {
      vi.setSystemTime(new Date("2024-12-26")); // Thursday, Dec 26, 2024

      const { result } = renderHook(() => useCalendarNavigation());

      act(() => {
        result.current.goToNextWeek();
      });

      const [newStart, newEnd] = result.current.currentWeek;

      // Should cross into next year
      expect(format(newStart, "yyyy-MM-dd")).toBe("2024-12-30"); // Monday
      expect(format(newEnd, "yyyy-MM-dd")).toBe("2025-01-05"); // Sunday
    });
  });

  describe("goToToday", () => {
    it("should return to current week from future week", () => {
      const { result } = renderHook(() => useCalendarNavigation());

      // Navigate to future
      act(() => {
        result.current.goToNextWeek();
        result.current.goToNextWeek();
        result.current.goToNextWeek();
      });

      // Return to today
      act(() => {
        result.current.goToToday();
      });

      const [start, end] = result.current.currentWeek;

      // Should be back to original week
      expect(format(start, "yyyy-MM-dd")).toBe("2024-12-16");
      expect(format(end, "yyyy-MM-dd")).toBe("2024-12-22");
    });

    it("should return to current week from past week", () => {
      const { result } = renderHook(() => useCalendarNavigation());

      // Navigate to past
      act(() => {
        result.current.goToPreviousWeek();
        result.current.goToPreviousWeek();
        result.current.goToPreviousWeek();
      });

      // Return to today
      act(() => {
        result.current.goToToday();
      });

      const [start, end] = result.current.currentWeek;

      // Should be back to original week
      expect(format(start, "yyyy-MM-dd")).toBe("2024-12-16");
      expect(format(end, "yyyy-MM-dd")).toBe("2024-12-22");
    });

    it("should have no effect when already on current week", () => {
      const { result } = renderHook(() => useCalendarNavigation());
      const [initialStart, initialEnd] = result.current.currentWeek;

      act(() => {
        result.current.goToToday();
      });

      const [newStart, newEnd] = result.current.currentWeek;

      // Should remain the same
      expect(format(newStart, "yyyy-MM-dd")).toBe(
        format(initialStart, "yyyy-MM-dd"),
      );
      expect(format(newEnd, "yyyy-MM-dd")).toBe(
        format(initialEnd, "yyyy-MM-dd"),
      );
    });

    it("should update currentDate to today", () => {
      const { result } = renderHook(() => useCalendarNavigation());
      const today = new Date();

      // Navigate away
      act(() => {
        result.current.goToNextWeek();
      });

      // Return to today
      act(() => {
        result.current.goToToday();
      });

      // currentDate should be today
      expect(format(result.current.currentDate, "yyyy-MM-dd")).toBe(
        format(today, "yyyy-MM-dd"),
      );
    });
  });

  describe("navigation combinations", () => {
    it("should handle forward then backward navigation", () => {
      const { result } = renderHook(() => useCalendarNavigation());
      const [initialStart, initialEnd] = result.current.currentWeek;

      // Go forward 2 weeks
      act(() => {
        result.current.goToNextWeek();
        result.current.goToNextWeek();
      });

      // Go backward 2 weeks
      act(() => {
        result.current.goToPreviousWeek();
        result.current.goToPreviousWeek();
      });

      const [finalStart, finalEnd] = result.current.currentWeek;

      // Should be back to original week
      expect(format(finalStart, "yyyy-MM-dd")).toBe(
        format(initialStart, "yyyy-MM-dd"),
      );
      expect(format(finalEnd, "yyyy-MM-dd")).toBe(
        format(initialEnd, "yyyy-MM-dd"),
      );
    });

    it("should handle backward then forward navigation", () => {
      const { result } = renderHook(() => useCalendarNavigation());
      const [initialStart, initialEnd] = result.current.currentWeek;

      // Go backward 3 weeks
      act(() => {
        result.current.goToPreviousWeek();
        result.current.goToPreviousWeek();
        result.current.goToPreviousWeek();
      });

      // Go forward 3 weeks
      act(() => {
        result.current.goToNextWeek();
        result.current.goToNextWeek();
        result.current.goToNextWeek();
      });

      const [finalStart, finalEnd] = result.current.currentWeek;

      // Should be back to original week
      expect(format(finalStart, "yyyy-MM-dd")).toBe(
        format(initialStart, "yyyy-MM-dd"),
      );
      expect(format(finalEnd, "yyyy-MM-dd")).toBe(
        format(initialEnd, "yyyy-MM-dd"),
      );
    });
  });
});

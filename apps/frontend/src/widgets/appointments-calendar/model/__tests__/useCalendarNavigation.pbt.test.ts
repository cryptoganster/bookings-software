import { describe, beforeEach, afterEach, vi } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { renderHook, act } from "@testing-library/react";
import { useCalendarNavigation } from "../useCalendarNavigation";
import { differenceInDays, format } from "date-fns";

// Define practical date range for testing (1900-2100)
const minDate = new Date(1900, 0, 1);
const maxDate = new Date(2100, 11, 31);

describe("useCalendarNavigation - Property-Based Tests", () => {
  beforeEach(() => {
    // Mock Date.now() to have consistent "today" for tests
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Property 7: Week Navigation Consistency", () => {
    test.prop([
      fc
        .date({ min: minDate, max: maxDate })
        .filter((d) => !isNaN(d.getTime())),
    ])(
      "previous week navigation should move exactly 7 days backward",
      (initialDate) => {
        vi.setSystemTime(initialDate);

        const { result } = renderHook(() => useCalendarNavigation());
        const [initialStart, initialEnd] = result.current.currentWeek;

        act(() => {
          result.current.goToPreviousWeek();
        });

        const [newStart, newEnd] = result.current.currentWeek;

        // Property: Previous week should be exactly 7 days earlier
        expect(differenceInDays(initialStart, newStart)).toBe(7);
        expect(differenceInDays(initialEnd, newEnd)).toBe(7);

        // Property: Week should still be 7 days long
        expect(differenceInDays(newEnd, newStart)).toBe(6);
      },
    );

    test.prop([
      fc
        .date({ min: minDate, max: maxDate })
        .filter((d) => !isNaN(d.getTime())),
    ])(
      "next week navigation should move exactly 7 days forward",
      (initialDate) => {
        vi.setSystemTime(initialDate);

        const { result } = renderHook(() => useCalendarNavigation());
        const [initialStart, initialEnd] = result.current.currentWeek;

        act(() => {
          result.current.goToNextWeek();
        });

        const [newStart, newEnd] = result.current.currentWeek;

        // Property: Next week should be exactly 7 days later
        expect(differenceInDays(newStart, initialStart)).toBe(7);
        expect(differenceInDays(newEnd, initialEnd)).toBe(7);

        // Property: Week should still be 7 days long
        expect(differenceInDays(newEnd, newStart)).toBe(6);
      },
    );

    test.prop([
      fc
        .date({ min: minDate, max: maxDate })
        .filter((d) => !isNaN(d.getTime())),
      fc.integer({ min: 1, max: 10 }),
    ])(
      "navigating forward N weeks then backward N weeks should return to original week",
      (initialDate, n) => {
        vi.setSystemTime(initialDate);

        const { result } = renderHook(() => useCalendarNavigation());
        const [initialStart, initialEnd] = result.current.currentWeek;

        // Navigate forward N weeks
        act(() => {
          for (let i = 0; i < n; i++) {
            result.current.goToNextWeek();
          }
        });

        // Navigate backward N weeks
        act(() => {
          for (let i = 0; i < n; i++) {
            result.current.goToPreviousWeek();
          }
        });

        const [finalStart, finalEnd] = result.current.currentWeek;

        // Property: Should return to original week
        expect(format(finalStart, "yyyy-MM-dd")).toBe(
          format(initialStart, "yyyy-MM-dd"),
        );
        expect(format(finalEnd, "yyyy-MM-dd")).toBe(
          format(initialEnd, "yyyy-MM-dd"),
        );
      },
    );

    test.prop([
      fc
        .date({ min: minDate, max: maxDate })
        .filter((d) => !isNaN(d.getTime())),
    ])(
      "multiple consecutive navigations should maintain week structure",
      (initialDate) => {
        vi.setSystemTime(initialDate);

        const { result } = renderHook(() => useCalendarNavigation());

        // Navigate through multiple weeks
        const weeks: Array<[Date, Date]> = [result.current.currentWeek];

        act(() => {
          result.current.goToNextWeek();
        });
        weeks.push(result.current.currentWeek);

        act(() => {
          result.current.goToNextWeek();
        });
        weeks.push(result.current.currentWeek);

        act(() => {
          result.current.goToPreviousWeek();
        });
        weeks.push(result.current.currentWeek);

        // Property: Each week should be exactly 7 days long
        weeks.forEach(([start, end]) => {
          const dayCount = differenceInDays(end, start) + 1;
          expect(dayCount).toBe(7);
        });

        // Property: Consecutive forward navigations should be 7 days apart
        const [start1] = weeks[0];
        const [start2] = weeks[1];
        const [start3] = weeks[2];

        expect(differenceInDays(start2, start1)).toBe(7);
        expect(differenceInDays(start3, start2)).toBe(7);

        // Property: Going back should return to previous week
        const [start4] = weeks[3];
        expect(format(start4, "yyyy-MM-dd")).toBe(format(start2, "yyyy-MM-dd"));
      },
    );
  });

  describe("Property 8: Today Navigation Invariant", () => {
    test.prop([
      fc
        .date({ min: minDate, max: maxDate })
        .filter((d) => !isNaN(d.getTime())),
      fc.integer({ min: -10, max: 10 }),
    ])(
      "goToToday should always navigate to week containing current date, regardless of current position",
      (todayDate, weeksOffset) => {
        vi.setSystemTime(todayDate);

        const { result } = renderHook(() => useCalendarNavigation());

        // Navigate to some arbitrary week (forward or backward)
        act(() => {
          if (weeksOffset > 0) {
            for (let i = 0; i < weeksOffset; i++) {
              result.current.goToNextWeek();
            }
          } else if (weeksOffset < 0) {
            for (let i = 0; i < Math.abs(weeksOffset); i++) {
              result.current.goToPreviousWeek();
            }
          }
        });

        // Navigate back to today
        act(() => {
          result.current.goToToday();
        });

        const [start, end] = result.current.currentWeek;

        // Property: Today's date should be within the returned week range
        const today = new Date();
        expect(today.getTime()).toBeGreaterThanOrEqual(start.getTime());
        expect(today.getTime()).toBeLessThanOrEqual(end.getTime());
      },
    );

    test.prop([
      fc
        .date({ min: minDate, max: maxDate })
        .filter((d) => !isNaN(d.getTime())),
    ])(
      "goToToday should be idempotent - calling it multiple times has same effect",
      (todayDate) => {
        vi.setSystemTime(todayDate);

        const { result } = renderHook(() => useCalendarNavigation());

        // Navigate away
        act(() => {
          result.current.goToNextWeek();
          result.current.goToNextWeek();
        });

        // Call goToToday multiple times
        act(() => {
          result.current.goToToday();
        });
        const [start1, end1] = result.current.currentWeek;

        act(() => {
          result.current.goToToday();
        });
        const [start2, end2] = result.current.currentWeek;

        act(() => {
          result.current.goToToday();
        });
        const [start3, end3] = result.current.currentWeek;

        // Property: All calls should return the same week
        expect(format(start1, "yyyy-MM-dd")).toBe(format(start2, "yyyy-MM-dd"));
        expect(format(start1, "yyyy-MM-dd")).toBe(format(start3, "yyyy-MM-dd"));
        expect(format(end1, "yyyy-MM-dd")).toBe(format(end2, "yyyy-MM-dd"));
        expect(format(end1, "yyyy-MM-dd")).toBe(format(end3, "yyyy-MM-dd"));
      },
    );
  });
});

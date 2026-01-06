import { describe } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { getWeekRange, formatDateSpanish } from "../dateUtils";
import { differenceInDays, getDay } from "date-fns";

// Define practical date range for testing (1900-2100)
const minDate = new Date(1900, 0, 1);
const maxDate = new Date(2100, 11, 31);

describe("dateUtils - Property-Based Tests", () => {
  describe("Property 2: Week Display Consistency", () => {
    test.prop([fc.date({ min: minDate, max: maxDate })])(
      "should always return exactly 7 consecutive days starting from Monday",
      (date) => {
        // Skip invalid dates
        if (!isFinite(date.getTime())) {
          return;
        }

        const [start, end] = getWeekRange(date);

        // Property 1: Week should contain exactly 7 days
        const dayCount = differenceInDays(end, start) + 1;
        expect(dayCount).toBe(7);

        // Property 2: Week should start on Monday (getDay returns 0 for Sunday, 1 for Monday, etc.)
        const startDay = getDay(start);
        expect(startDay).toBe(1); // Monday

        // Property 3: Week should end on Sunday
        const endDay = getDay(end);
        expect(endDay).toBe(0); // Sunday

        // Property 4: Start date should be <= input date <= end date
        expect(start.getTime()).toBeLessThanOrEqual(date.getTime());
        expect(date.getTime()).toBeLessThanOrEqual(end.getTime());
      },
    );

    test.prop([fc.date({ min: minDate, max: maxDate })])(
      "should be idempotent - calling getWeekRange on any day of the week returns the same week",
      (date) => {
        // Skip invalid dates
        if (!isFinite(date.getTime())) {
          return;
        }

        const [start1, end1] = getWeekRange(date);

        // Get week range for the start date (Monday)
        const [start2, end2] = getWeekRange(start1);

        // Get week range for the end date (Sunday)
        const [start3, end3] = getWeekRange(end1);

        // All should return the same week
        expect(start1.getTime()).toBe(start2.getTime());
        expect(start1.getTime()).toBe(start3.getTime());
        expect(end1.getTime()).toBe(end2.getTime());
        expect(end1.getTime()).toBe(end3.getTime());
      },
    );

    test.prop([fc.date({ min: minDate, max: maxDate })])(
      "should handle year boundaries correctly",
      (date) => {
        // Skip invalid dates
        if (!isFinite(date.getTime())) {
          return;
        }

        const [start, end] = getWeekRange(date);

        // Week should still be 7 days even across year boundaries
        const dayCount = differenceInDays(end, start) + 1;
        expect(dayCount).toBe(7);

        // Start should still be Monday
        expect(getDay(start)).toBe(1);

        // End should still be Sunday
        expect(getDay(end)).toBe(0);
      },
    );
  });

  describe("formatDateSpanish - Property Tests", () => {
    test.prop([fc.date({ min: minDate, max: maxDate })])(
      "should always return a string",
      (date) => {
        // Skip invalid dates
        if (!isFinite(date.getTime())) {
          return;
        }

        const result = formatDateSpanish(date, "EEEE");
        expect(typeof result).toBe("string");
        expect(result.length).toBeGreaterThan(0);
      },
    );

    test.prop([fc.date({ min: minDate, max: maxDate })])(
      "should be deterministic - same input produces same output",
      (date) => {
        // Skip invalid dates
        if (!isFinite(date.getTime())) {
          return;
        }

        const result1 = formatDateSpanish(date, "MMM d, yyyy");
        const result2 = formatDateSpanish(date, "MMM d, yyyy");
        expect(result1).toBe(result2);
      },
    );
  });
});

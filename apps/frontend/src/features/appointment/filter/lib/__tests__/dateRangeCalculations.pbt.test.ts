import { describe, expect, beforeEach, afterEach, vi } from "vitest";
import { fc, test } from "@fast-check/vitest";
import {
  getTodayRange,
  getWeekRange,
  getMonthRange,
} from "../dateRangeCalculations";

describe("dateRangeCalculations - Property-Based Tests", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Property 1: Consistency", () => {
    test.prop([
      fc
        .date({ min: new Date("2020-01-01"), max: new Date("2030-12-31") })
        .filter((d) => !isNaN(d.getTime())),
    ])(
      "getTodayRange should return same result when called multiple times for same date",
      (date) => {
        vi.setSystemTime(date);

        const result1 = getTodayRange();
        const result2 = getTodayRange();
        const result3 = getTodayRange();

        expect(result1[0].getTime()).toBe(result2[0].getTime());
        expect(result1[1].getTime()).toBe(result2[1].getTime());
        expect(result2[0].getTime()).toBe(result3[0].getTime());
        expect(result2[1].getTime()).toBe(result3[1].getTime());
      },
    );

    test.prop([
      fc
        .date({ min: new Date("2020-01-01"), max: new Date("2030-12-31") })
        .filter((d) => !isNaN(d.getTime())),
    ])(
      "getWeekRange should return same result when called multiple times for same date",
      (date) => {
        vi.setSystemTime(date);

        const result1 = getWeekRange();
        const result2 = getWeekRange();

        expect(result1[0].getTime()).toBe(result2[0].getTime());
        expect(result1[1].getTime()).toBe(result2[1].getTime());
      },
    );

    test.prop([
      fc
        .date({ min: new Date("2020-01-01"), max: new Date("2030-12-31") })
        .filter((d) => !isNaN(d.getTime())),
    ])(
      "getMonthRange should return same result when called multiple times for same date",
      (date) => {
        vi.setSystemTime(date);

        const result1 = getMonthRange();
        const result2 = getMonthRange();

        expect(result1[0].getTime()).toBe(result2[0].getTime());
        expect(result1[1].getTime()).toBe(result2[1].getTime());
      },
    );
  });

  describe("Property 2: Boundaries", () => {
    test.prop([
      fc
        .date({ min: new Date("2020-01-01"), max: new Date("2030-12-31") })
        .filter((d) => !isNaN(d.getTime())),
    ])(
      "getTodayRange should have start at 00:00:00 and end at 23:59:59",
      (date) => {
        vi.setSystemTime(date);

        const [start, end] = getTodayRange();

        expect(start.getHours()).toBe(0);
        expect(start.getMinutes()).toBe(0);
        expect(start.getSeconds()).toBe(0);
        expect(start.getMilliseconds()).toBe(0);

        expect(end.getHours()).toBe(23);
        expect(end.getMinutes()).toBe(59);
        expect(end.getSeconds()).toBe(59);
        expect(end.getMilliseconds()).toBe(999);
      },
    );

    test.prop([
      fc
        .date({ min: new Date("2020-01-01"), max: new Date("2030-12-31") })
        .filter((d) => !isNaN(d.getTime())),
    ])(
      "getWeekRange should have start at 00:00:00 and end at 23:59:59",
      (date) => {
        vi.setSystemTime(date);

        const [start, end] = getWeekRange();

        expect(start.getHours()).toBe(0);
        expect(start.getMinutes()).toBe(0);
        expect(start.getSeconds()).toBe(0);

        expect(end.getHours()).toBe(23);
        expect(end.getMinutes()).toBe(59);
        expect(end.getSeconds()).toBe(59);
      },
    );

    test.prop([
      fc
        .date({ min: new Date("2020-01-01"), max: new Date("2030-12-31") })
        .filter((d) => !isNaN(d.getTime())),
    ])(
      "getMonthRange should have start at 00:00:00 and end at 23:59:59",
      (date) => {
        vi.setSystemTime(date);

        const [start, end] = getMonthRange();

        expect(start.getHours()).toBe(0);
        expect(start.getMinutes()).toBe(0);
        expect(start.getSeconds()).toBe(0);

        expect(end.getHours()).toBe(23);
        expect(end.getMinutes()).toBe(59);
        expect(end.getSeconds()).toBe(59);
      },
    );
  });

  describe("Property 3: Week starts Monday", () => {
    test.prop([
      fc
        .date({ min: new Date("2020-01-01"), max: new Date("2030-12-31") })
        .filter((d) => !isNaN(d.getTime())),
    ])("getWeekRange should always start on Monday (day 1)", (date) => {
      vi.setSystemTime(date);

      const [start] = getWeekRange();

      expect(start.getDay()).toBe(1); // Monday
    });

    test.prop([
      fc
        .date({ min: new Date("2020-01-01"), max: new Date("2030-12-31") })
        .filter((d) => !isNaN(d.getTime())),
    ])("getWeekRange should always end on Sunday (day 0)", (date) => {
      vi.setSystemTime(date);

      const [, end] = getWeekRange();

      expect(end.getDay()).toBe(0); // Sunday
    });
  });

  describe("Property 4: Month covers full month", () => {
    test.prop([
      fc
        .date({ min: new Date("2020-01-01"), max: new Date("2030-12-31") })
        .filter((d) => !isNaN(d.getTime())),
    ])("getMonthRange should start on day 1 of the month", (date) => {
      vi.setSystemTime(date);

      const [start] = getMonthRange();

      expect(start.getDate()).toBe(1);
    });

    test.prop([
      fc
        .date({ min: new Date("2020-01-01"), max: new Date("2030-12-31") })
        .filter((d) => !isNaN(d.getTime())),
    ])("getMonthRange should end on last day of the month", (date) => {
      vi.setSystemTime(date);

      const [start, end] = getMonthRange();

      // Verify end is last day by checking next day is first of next month
      const nextDay = new Date(end);
      nextDay.setDate(nextDay.getDate() + 1);
      nextDay.setHours(0, 0, 0, 0);

      expect(nextDay.getDate()).toBe(1);
      expect(start.getMonth()).toBe(end.getMonth());
    });
  });

  describe("Property 5: Range ordering", () => {
    test.prop([
      fc
        .date({ min: new Date("2020-01-01"), max: new Date("2030-12-31") })
        .filter((d) => !isNaN(d.getTime())),
    ])("All range functions should return start before end", (date) => {
      vi.setSystemTime(date);

      const todayRange = getTodayRange();
      const weekRange = getWeekRange();
      const monthRange = getMonthRange();

      expect(todayRange[0].getTime()).toBeLessThanOrEqual(
        todayRange[1].getTime(),
      );
      expect(weekRange[0].getTime()).toBeLessThan(weekRange[1].getTime());
      expect(monthRange[0].getTime()).toBeLessThan(monthRange[1].getTime());
    });
  });
});

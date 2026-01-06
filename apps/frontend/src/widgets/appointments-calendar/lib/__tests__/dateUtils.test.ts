import { describe, it, expect } from "vitest";
import {
  getWeekRange,
  formatDateSpanish,
  formatDateRange,
  formatDayName,
  formatShortDate,
} from "../dateUtils";
import { format } from "date-fns";

describe("dateUtils", () => {
  describe("getWeekRange", () => {
    it("should return week range for a mid-week date", () => {
      const date = new Date(2024, 11, 18); // Wednesday, Dec 18, 2024 (month is 0-indexed)
      const [start, end] = getWeekRange(date);

      expect(format(start, "yyyy-MM-dd")).toBe("2024-12-16"); // Monday
      expect(format(end, "yyyy-MM-dd")).toBe("2024-12-22"); // Sunday
    });

    it("should return week range for a Monday", () => {
      const date = new Date(2024, 11, 16); // Monday, Dec 16, 2024
      const [start, end] = getWeekRange(date);

      expect(format(start, "yyyy-MM-dd")).toBe("2024-12-16"); // Same Monday
      expect(format(end, "yyyy-MM-dd")).toBe("2024-12-22"); // Sunday
    });

    it("should return week range for a Sunday", () => {
      const date = new Date(2024, 11, 22); // Sunday, Dec 22, 2024
      const [start, end] = getWeekRange(date);

      expect(format(start, "yyyy-MM-dd")).toBe("2024-12-16"); // Monday
      expect(format(end, "yyyy-MM-dd")).toBe("2024-12-22"); // Same Sunday
    });

    it("should handle year boundary correctly", () => {
      const date = new Date(2024, 11, 31); // Tuesday, Dec 31, 2024
      const [start, end] = getWeekRange(date);

      expect(format(start, "yyyy-MM-dd")).toBe("2024-12-30"); // Monday
      expect(format(end, "yyyy-MM-dd")).toBe("2025-01-05"); // Sunday (next year)
    });

    it("should handle leap year correctly", () => {
      const date = new Date(2024, 1, 29); // Thursday, Feb 29, 2024
      const [start, end] = getWeekRange(date);

      expect(format(start, "yyyy-MM-dd")).toBe("2024-02-26"); // Monday
      expect(format(end, "yyyy-MM-dd")).toBe("2024-03-03"); // Sunday
    });
  });

  describe("formatDateSpanish", () => {
    it("should format day name in Spanish", () => {
      const date = new Date(2024, 11, 18); // Wednesday, Dec 18, 2024 (month is 0-indexed)
      const result = formatDateSpanish(date, "EEEE");

      expect(result).toBe("miércoles");
    });

    it("should format short month and day in Spanish", () => {
      const date = new Date(2024, 11, 18); // Dec 18, 2024
      const result = formatDateSpanish(date, "MMM d");

      expect(result).toBe("dic 18");
    });

    it("should format full date in Spanish", () => {
      const date = new Date(2024, 11, 18); // Dec 18, 2024
      const result = formatDateSpanish(date, "MMM d, yyyy");

      expect(result).toBe("dic 18, 2024");
    });

    it("should handle different months correctly", () => {
      const dates = [
        { date: new Date(2024, 0, 15), expected: "ene 15" },
        { date: new Date(2024, 1, 15), expected: "feb 15" },
        { date: new Date(2024, 2, 15), expected: "mar 15" },
        { date: new Date(2024, 3, 15), expected: "abr 15" },
        { date: new Date(2024, 4, 15), expected: "may 15" },
        { date: new Date(2024, 5, 15), expected: "jun 15" },
        { date: new Date(2024, 6, 15), expected: "jul 15" },
        { date: new Date(2024, 7, 15), expected: "ago 15" },
        { date: new Date(2024, 8, 15), expected: "sep 15" }, // Spanish locale uses "sep" not "sept"
        { date: new Date(2024, 9, 15), expected: "oct 15" },
        { date: new Date(2024, 10, 15), expected: "nov 15" },
        { date: new Date(2024, 11, 15), expected: "dic 15" },
      ];

      dates.forEach(({ date, expected }) => {
        const result = formatDateSpanish(date, "MMM d");
        expect(result).toBe(expected);
      });
    });
  });

  describe("formatDateRange", () => {
    it("should format date range correctly", () => {
      const start = new Date(2024, 11, 16); // Monday, Dec 16, 2024 (month is 0-indexed)
      const end = new Date(2024, 11, 22); // Sunday, Dec 22, 2024
      const result = formatDateRange(start, end);

      expect(result).toBe("dic 16 - dic 22, 2024");
    });

    it("should handle cross-month range", () => {
      const start = new Date(2024, 11, 30); // Monday, Dec 30, 2024
      const end = new Date(2025, 0, 5); // Sunday, Jan 5, 2025
      const result = formatDateRange(start, end);

      expect(result).toBe("dic 30 - ene 5, 2025");
    });

    it("should handle same month range", () => {
      const start = new Date(2024, 11, 2); // Monday, Dec 2, 2024
      const end = new Date(2024, 11, 8); // Sunday, Dec 8, 2024
      const result = formatDateRange(start, end);

      expect(result).toBe("dic 2 - dic 8, 2024");
    });
  });

  describe("formatDayName", () => {
    it("should format day name in uppercase Spanish", () => {
      const dates = [
        { date: new Date(2024, 11, 16), expected: "LUNES" }, // Monday, Dec 16, 2024 (month is 0-indexed)
        { date: new Date(2024, 11, 17), expected: "MARTES" }, // Tuesday, Dec 17, 2024
        { date: new Date(2024, 11, 18), expected: "MIÉRCOLES" }, // Wednesday, Dec 18, 2024
        { date: new Date(2024, 11, 19), expected: "JUEVES" }, // Thursday, Dec 19, 2024
        { date: new Date(2024, 11, 20), expected: "VIERNES" }, // Friday, Dec 20, 2024
        { date: new Date(2024, 11, 21), expected: "SÁBADO" }, // Saturday, Dec 21, 2024
        { date: new Date(2024, 11, 22), expected: "DOMINGO" }, // Sunday, Dec 22, 2024
      ];

      dates.forEach(({ date, expected }) => {
        const result = formatDayName(date);
        expect(result).toBe(expected);
      });
    });
  });

  describe("formatShortDate", () => {
    it("should format short date in Spanish", () => {
      const date = new Date(2024, 11, 18); // Dec 18, 2024 (month is 0-indexed)
      const result = formatShortDate(date);

      expect(result).toBe("dic 18");
    });

    it("should handle single-digit days", () => {
      const date = new Date(2024, 11, 5); // Dec 5, 2024
      const result = formatShortDate(date);

      expect(result).toBe("dic 5");
    });

    it("should handle different months", () => {
      const date = new Date(2024, 0, 15); // Jan 15, 2024
      const result = formatShortDate(date);

      expect(result).toBe("ene 15");
    });
  });
});

/**
 * Tests for Date Formatters
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  formatDate,
  formatTime,
  formatDateTime,
  formatRelativeDate,
  formatDayOfWeek,
  formatMonthYear,
} from "../formatters";

describe("date formatters", () => {
  const testDate = new Date("2024-01-15T14:30:00Z");

  describe("formatDate", () => {
    it("should format date with default format", () => {
      const result = formatDate(testDate);
      expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    });

    it("should format date with custom format", () => {
      const result = formatDate(testDate, "yyyy-MM-dd");
      expect(result).toBe("2024-01-15");
    });

    it("should format ISO string", () => {
      const result = formatDate("2024-01-15T14:30:00Z");
      expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    });

    it("should format timestamp", () => {
      const result = formatDate(testDate.getTime());
      expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    });
  });

  describe("formatTime", () => {
    it("should format time with default format", () => {
      const result = formatTime(testDate);
      expect(result).toMatch(/\d{2}:\d{2}/);
    });

    it("should format time with custom format", () => {
      const result = formatTime(testDate, "HH:mm:ss");
      expect(result).toMatch(/\d{2}:\d{2}:\d{2}/);
    });

    it("should format ISO string", () => {
      const result = formatTime("2024-01-15T14:30:00Z");
      expect(result).toMatch(/\d{2}:\d{2}/);
    });

    it("should format timestamp", () => {
      const result = formatTime(testDate.getTime());
      expect(result).toMatch(/\d{2}:\d{2}/);
    });
  });

  describe("formatDateTime", () => {
    it("should format date and time with default format", () => {
      const result = formatDateTime(testDate);
      expect(result).toMatch(/\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}/);
    });

    it("should format date and time with custom format", () => {
      const result = formatDateTime(testDate, "yyyy-MM-dd HH:mm:ss");
      expect(result).toMatch(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/);
    });

    it("should format ISO string", () => {
      const result = formatDateTime("2024-01-15T14:30:00Z");
      expect(result).toMatch(/\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}/);
    });
  });

  describe("formatRelativeDate", () => {
    beforeEach(() => {
      // Use fake timers to control time in tests
      vi.useFakeTimers();
    });

    afterEach(() => {
      // Restore real timers after each test
      vi.useRealTimers();
    });

    it("should return 'ahora' for current time", () => {
      // Set a fixed time
      const fixedTime = new Date("2024-01-15T14:30:00Z");
      vi.setSystemTime(fixedTime);

      // Test with the same time
      const result = formatRelativeDate(fixedTime);
      expect(result).toBe("ahora");
    });

    it("should format future minutes", () => {
      const fixedTime = new Date("2024-01-15T14:30:00Z");
      vi.setSystemTime(fixedTime);

      const future = new Date(fixedTime.getTime() + 5 * 60 * 1000);
      const result = formatRelativeDate(future);
      expect(result).toMatch(/en \d+ minutos?/);
    });

    it("should format past minutes", () => {
      const fixedTime = new Date("2024-01-15T14:30:00Z");
      vi.setSystemTime(fixedTime);

      const past = new Date(fixedTime.getTime() - 5 * 60 * 1000);
      const result = formatRelativeDate(past);
      expect(result).toMatch(/hace \d+ minutos?/);
    });

    it("should format future hours", () => {
      const fixedTime = new Date("2024-01-15T14:30:00Z");
      vi.setSystemTime(fixedTime);

      const future = new Date(fixedTime.getTime() + 2 * 60 * 60 * 1000);
      const result = formatRelativeDate(future);
      expect(result).toMatch(/en \d+ horas?/);
    });

    it("should format past hours", () => {
      const fixedTime = new Date("2024-01-15T14:30:00Z");
      vi.setSystemTime(fixedTime);

      const past = new Date(fixedTime.getTime() - 2 * 60 * 60 * 1000);
      const result = formatRelativeDate(past);
      expect(result).toMatch(/hace \d+ horas?/);
    });

    it("should format future days", () => {
      const fixedTime = new Date("2024-01-15T14:30:00Z");
      vi.setSystemTime(fixedTime);

      const future = new Date(fixedTime.getTime() + 3 * 24 * 60 * 60 * 1000);
      const result = formatRelativeDate(future);
      expect(result).toMatch(/en \d+ días?/);
    });

    it("should format past days", () => {
      const fixedTime = new Date("2024-01-15T14:30:00Z");
      vi.setSystemTime(fixedTime);

      const past = new Date(fixedTime.getTime() - 3 * 24 * 60 * 60 * 1000);
      const result = formatRelativeDate(past);
      expect(result).toMatch(/hace \d+ días?/);
    });

    it("should handle singular minute", () => {
      const fixedTime = new Date("2024-01-15T14:30:00Z");
      vi.setSystemTime(fixedTime);

      const future = new Date(fixedTime.getTime() + 1 * 60 * 1000);
      const result = formatRelativeDate(future);
      expect(result).toBe("en 1 minuto");
    });

    it("should handle singular hour", () => {
      const fixedTime = new Date("2024-01-15T14:30:00Z");
      vi.setSystemTime(fixedTime);

      const future = new Date(fixedTime.getTime() + 1 * 60 * 60 * 1000);
      const result = formatRelativeDate(future);
      expect(result).toBe("en 1 hora");
    });

    it("should handle singular day", () => {
      const fixedTime = new Date("2024-01-15T14:30:00Z");
      vi.setSystemTime(fixedTime);

      const future = new Date(fixedTime.getTime() + 1 * 24 * 60 * 60 * 1000);
      const result = formatRelativeDate(future);
      expect(result).toBe("en 1 día");
    });
  });

  describe("formatDayOfWeek", () => {
    it("should format day of week", () => {
      const result = formatDayOfWeek(testDate);
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });

    it("should format ISO string", () => {
      const result = formatDayOfWeek("2024-01-15T14:30:00Z");
      expect(typeof result).toBe("string");
    });

    it("should format timestamp", () => {
      const result = formatDayOfWeek(testDate.getTime());
      expect(typeof result).toBe("string");
    });
  });

  describe("formatMonthYear", () => {
    it("should format month and year", () => {
      const result = formatMonthYear(testDate);
      expect(result).toMatch(/\w+ \d{4}/);
    });

    it("should format ISO string", () => {
      const result = formatMonthYear("2024-01-15T14:30:00Z");
      expect(result).toMatch(/\w+ \d{4}/);
    });

    it("should format timestamp", () => {
      const result = formatMonthYear(testDate.getTime());
      expect(result).toMatch(/\w+ \d{4}/);
    });
  });
});

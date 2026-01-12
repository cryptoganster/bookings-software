/**
 * Tests for Date Formatters
 */

import { describe, it, expect } from "vitest";
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
    it("should return 'ahora' for current time", () => {
      // Use a fixed timestamp to avoid timing issues in CI
      const now = Date.now();
      const result = formatRelativeDate(now);
      expect(result).toBe("ahora");
    });

    it("should format future minutes", () => {
      const future = new Date(Date.now() + 5 * 60 * 1000);
      const result = formatRelativeDate(future);
      expect(result).toMatch(/en \d+ minutos?/);
    });

    it("should format past minutes", () => {
      const past = new Date(Date.now() - 5 * 60 * 1000);
      const result = formatRelativeDate(past);
      expect(result).toMatch(/hace \d+ minutos?/);
    });

    it("should format future hours", () => {
      const future = new Date(Date.now() + 2 * 60 * 60 * 1000);
      const result = formatRelativeDate(future);
      expect(result).toMatch(/en \d+ horas?/);
    });

    it("should format past hours", () => {
      const past = new Date(Date.now() - 2 * 60 * 60 * 1000);
      const result = formatRelativeDate(past);
      expect(result).toMatch(/hace \d+ horas?/);
    });

    it("should format future days", () => {
      const future = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
      const result = formatRelativeDate(future);
      expect(result).toMatch(/en \d+ días?/);
    });

    it("should format past days", () => {
      const past = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      const result = formatRelativeDate(past);
      expect(result).toMatch(/hace \d+ días?/);
    });

    it("should handle singular minute", () => {
      const future = new Date(Date.now() + 1 * 60 * 1000);
      const result = formatRelativeDate(future);
      expect(result).toBe("en 1 minuto");
    });

    it("should handle singular hour", () => {
      const future = new Date(Date.now() + 1 * 60 * 60 * 1000);
      const result = formatRelativeDate(future);
      expect(result).toBe("en 1 hora");
    });

    it("should handle singular day", () => {
      const future = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000);
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

/**
 * Tests for Timezone Utilities
 */

import { describe, it, expect } from "vitest";
import {
  convertToTimezone,
  convertFromTimezone,
  formatInTimezone,
  getUserTimezone,
  getTimezoneOffset,
  isDaylightSavingTime,
  serverToUserTimezone,
  userToServerTimezone,
} from "../timezone";

describe("timezone utilities", () => {
  const testDate = new Date("2024-01-15T12:00:00Z");
  const testTimezone = "America/New_York";

  describe("convertToTimezone", () => {
    it("should convert Date to timezone", () => {
      const result = convertToTimezone(testDate, testTimezone);
      expect(result).toBeInstanceOf(Date);
    });

    it("should convert ISO string to timezone", () => {
      const result = convertToTimezone("2024-01-15T12:00:00Z", testTimezone);
      expect(result).toBeInstanceOf(Date);
    });

    it("should convert timestamp to timezone", () => {
      const result = convertToTimezone(testDate.getTime(), testTimezone);
      expect(result).toBeInstanceOf(Date);
    });
  });

  describe("convertFromTimezone", () => {
    it("should convert Date from timezone to UTC", () => {
      const result = convertFromTimezone(testDate, testTimezone);
      expect(result).toBeInstanceOf(Date);
    });

    it("should convert ISO string from timezone to UTC", () => {
      const result = convertFromTimezone("2024-01-15T12:00:00Z", testTimezone);
      expect(result).toBeInstanceOf(Date);
    });

    it("should convert timestamp from timezone to UTC", () => {
      const result = convertFromTimezone(testDate.getTime(), testTimezone);
      expect(result).toBeInstanceOf(Date);
    });
  });

  describe("formatInTimezone", () => {
    it("should format date in timezone with default format", () => {
      const result = formatInTimezone(testDate, testTimezone);
      expect(result).toMatch(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/);
    });

    it("should format date in timezone with custom format", () => {
      const result = formatInTimezone(testDate, testTimezone, "yyyy-MM-dd");
      expect(result).toBe("2024-01-15");
    });

    it("should format ISO string in timezone", () => {
      const result = formatInTimezone(
        "2024-01-15T12:00:00Z",
        testTimezone,
        "HH:mm",
      );
      expect(result).toMatch(/\d{2}:\d{2}/);
    });
  });

  describe("getUserTimezone", () => {
    it("should return user timezone", () => {
      const result = getUserTimezone();
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe("getTimezoneOffset", () => {
    it("should return timezone offset in minutes", () => {
      const result = getTimezoneOffset(testTimezone, testDate);
      expect(typeof result).toBe("number");
    });

    it("should use current date if not provided", () => {
      const result = getTimezoneOffset(testTimezone);
      expect(typeof result).toBe("number");
    });
  });

  describe("isDaylightSavingTime", () => {
    it("should check if date is in DST", () => {
      const result = isDaylightSavingTime(testDate, testTimezone);
      expect(typeof result).toBe("boolean");
    });

    it("should handle ISO string", () => {
      const result = isDaylightSavingTime("2024-07-15T12:00:00Z", testTimezone);
      expect(typeof result).toBe("boolean");
    });

    it("should handle timestamp", () => {
      const result = isDaylightSavingTime(testDate.getTime(), testTimezone);
      expect(typeof result).toBe("boolean");
    });
  });

  describe("serverToUserTimezone", () => {
    it("should convert server date to user timezone", () => {
      const result = serverToUserTimezone(testDate);
      expect(result).toBeInstanceOf(Date);
    });

    it("should handle ISO string", () => {
      const result = serverToUserTimezone("2024-01-15T12:00:00Z");
      expect(result).toBeInstanceOf(Date);
    });

    it("should handle timestamp", () => {
      const result = serverToUserTimezone(testDate.getTime());
      expect(result).toBeInstanceOf(Date);
    });
  });

  describe("userToServerTimezone", () => {
    it("should convert user date to server timezone (UTC)", () => {
      const result = userToServerTimezone(testDate);
      expect(result).toBeInstanceOf(Date);
    });

    it("should handle ISO string", () => {
      const result = userToServerTimezone("2024-01-15T12:00:00Z");
      expect(result).toBeInstanceOf(Date);
    });

    it("should handle timestamp", () => {
      const result = userToServerTimezone(testDate.getTime());
      expect(result).toBeInstanceOf(Date);
    });
  });
});

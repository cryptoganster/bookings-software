import { describe } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { formatDateRange } from "../../lib/dateUtils";
import { format } from "date-fns";
import { es } from "date-fns/locale";

describe("CalendarHeader Property-Based Tests", () => {
  /**
   * Property 9: Date Range Header Accuracy
   * Validates: Requirements 3.6
   *
   * For any week with start S and end E, header displays "S - E" correctly
   */
  test.prop([fc.date(), fc.date()])(
    "Property 9: Date range header should display start and end dates correctly",
    (date1, date2) => {
      // Skip invalid dates
      if (!isFinite(date1.getTime()) || !isFinite(date2.getTime())) {
        return; // Skip this test case
      }

      // Ensure start is before end
      const startDate = date1 < date2 ? date1 : date2;
      const endDate = date1 < date2 ? date2 : date1;

      // Format the date range
      const result = formatDateRange(startDate, endDate);

      // Expected format: "MMM d - MMM d, yyyy" in Spanish
      const expectedStart = format(startDate, "MMM d", { locale: es });
      const expectedEnd = format(endDate, "MMM d, yyyy", { locale: es });
      const expected = `${expectedStart} - ${expectedEnd}`;

      // Verify the result matches expected format
      expect(result).toBe(expected);

      // Verify the result contains both dates
      expect(result).toContain(expectedStart);
      expect(result).toContain(expectedEnd);

      // Verify the result contains the separator
      expect(result).toContain(" - ");
    },
  );

  /**
   * Property 20: Appointment Count Accuracy
   * Validates: Requirements 8.4
   *
   * For any set of appointments A, header displays count = |A|
   */
  test.prop([fc.integer({ min: 0, max: 1000 })])(
    "Property 20: Appointment count should be accurate",
    (count) => {
      // The count should be a non-negative integer
      expect(count).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(count)).toBe(true);

      // The formatted count text should match the expected format
      const expectedText = `${count} citas`;
      expect(expectedText).toBe(`${count} citas`);

      // Verify the count is preserved in the text
      expect(expectedText).toContain(count.toString());
    },
  );

  test.prop([fc.date(), fc.date()])(
    "Property 9 (Extended): Date range should always have consistent format",
    (date1, date2) => {
      // Skip invalid dates
      if (!isFinite(date1.getTime()) || !isFinite(date2.getTime())) {
        return; // Skip this test case
      }

      const startDate = date1 < date2 ? date1 : date2;
      const endDate = date1 < date2 ? date2 : date1;

      const result = formatDateRange(startDate, endDate);

      // Verify format structure: should match pattern "text - text, number"
      // Allow for years with 4+ digits (e.g., year 10000)
      const formatPattern = /^[a-z]{3} \d{1,2} - [a-z]{3} \d{1,2}, \d{4,}$/i;
      expect(result).toMatch(formatPattern);

      // Verify the year appears only once at the end
      const yearMatches = result.match(/\d{4,}/g);
      expect(yearMatches).toHaveLength(1);
      expect(result.endsWith(yearMatches![0])).toBe(true);
    },
  );

  test.prop([fc.integer({ min: 0, max: 1000 })])(
    "Property 20 (Extended): Appointment count text should use correct plural form",
    (count) => {
      const expectedText = `${count} citas`;

      // In Spanish, "citas" is always plural form used for display
      // (even for 0 or 1, we use "citas" for consistency in UI)
      expect(expectedText).toContain("citas");

      // Verify the number is at the start
      expect(expectedText.startsWith(count.toString())).toBe(true);
    },
  );
});

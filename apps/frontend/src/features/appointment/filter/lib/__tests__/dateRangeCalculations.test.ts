import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getTodayRange,
  getWeekRange,
  getMonthRange,
  formatDateRangeLabel,
} from '../dateRangeCalculations';

describe('dateRangeCalculations', () => {
  beforeEach(() => {
    // Mock current date to 2024-12-18 (Wednesday) 14:30:00
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-12-18T14:30:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('getTodayRange', () => {
    it('should return range for current day with correct hours', () => {
      const [start, end] = getTodayRange();

      expect(start.getHours()).toBe(0);
      expect(start.getMinutes()).toBe(0);
      expect(start.getSeconds()).toBe(0);
      expect(start.getMilliseconds()).toBe(0);

      expect(end.getHours()).toBe(23);
      expect(end.getMinutes()).toBe(59);
      expect(end.getSeconds()).toBe(59);
      expect(end.getMilliseconds()).toBe(999);
    });

    it('should return same day for start and end', () => {
      const [start, end] = getTodayRange();

      expect(start.getDate()).toBe(end.getDate());
      expect(start.getMonth()).toBe(end.getMonth());
      expect(start.getFullYear()).toBe(end.getFullYear());
    });
  });

  describe('getWeekRange', () => {
    it('should return Monday to Sunday of current week', () => {
      const [start, end] = getWeekRange();

      // 2024-12-18 is Wednesday, so week should be Dec 16 (Mon) to Dec 22 (Sun)
      expect(start.getDay()).toBe(1); // Monday
      expect(end.getDay()).toBe(0); // Sunday
    });

    it('should have start at 00:00:00 and end at 23:59:59', () => {
      const [start, end] = getWeekRange();

      expect(start.getHours()).toBe(0);
      expect(start.getMinutes()).toBe(0);
      expect(start.getSeconds()).toBe(0);

      expect(end.getHours()).toBe(23);
      expect(end.getMinutes()).toBe(59);
      expect(end.getSeconds()).toBe(59);
    });

    it('should span exactly 7 days', () => {
      const [start, end] = getWeekRange();
      const diffInDays = Math.floor(
        (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
      );

      expect(diffInDays).toBe(6); // 6 full days difference (Mon to Sun)
    });
  });

  describe('getMonthRange', () => {
    it('should return first to last day of current month', () => {
      const [start, end] = getMonthRange();

      expect(start.getDate()).toBe(1);
      expect(end.getDate()).toBe(31); // December has 31 days
      expect(start.getMonth()).toBe(end.getMonth());
    });

    it('should have start at 00:00:00 and end at 23:59:59', () => {
      const [start, end] = getMonthRange();

      expect(start.getHours()).toBe(0);
      expect(start.getMinutes()).toBe(0);
      expect(start.getSeconds()).toBe(0);

      expect(end.getHours()).toBe(23);
      expect(end.getMinutes()).toBe(59);
      expect(end.getSeconds()).toBe(59);
    });
  });

  describe('formatDateRangeLabel', () => {
    it('should format date range correctly', () => {
      const range: [Date, Date] = [
        new Date('2024-12-01T00:00:00'),
        new Date('2024-12-31T23:59:59'),
      ];

      const label = formatDateRangeLabel(range);

      expect(label).toBe('01/12/2024 - 31/12/2024');
    });

    it('should format single day range correctly', () => {
      const range: [Date, Date] = [
        new Date('2024-12-18T00:00:00'),
        new Date('2024-12-18T23:59:59'),
      ];

      const label = formatDateRangeLabel(range);

      expect(label).toBe('18/12/2024 - 18/12/2024');
    });
  });
});

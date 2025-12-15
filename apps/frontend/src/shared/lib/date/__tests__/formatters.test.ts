import { describe, it, expect } from 'vitest';
import {
  formatDate,
  formatTime,
  formatDateTime,
  formatDayOfWeek,
  formatMonthYear,
} from '../formatters';

describe('Date Formatters', () => {
  const testDate = new Date('2024-12-15T14:30:00Z');

  describe('formatDate', () => {
    it('should format date with default format', () => {
      const result = formatDate(testDate);
      expect(result).toBe('15/12/2024');
    });

    it('should format date with custom format', () => {
      const result = formatDate(testDate, 'yyyy-MM-dd');
      expect(result).toBe('2024-12-15');
    });

    it('should handle ISO string input', () => {
      const result = formatDate('2024-12-15T14:30:00Z');
      expect(result).toBe('15/12/2024');
    });

    it('should handle timestamp input', () => {
      const result = formatDate(testDate.getTime());
      expect(result).toBe('15/12/2024');
    });
  });

  describe('formatTime', () => {
    it('should format time with default format', () => {
      const result = formatTime(testDate);
      expect(result).toMatch(/^\d{2}:\d{2}$/);
    });

    it('should format time with custom format', () => {
      const result = formatTime(testDate, 'HH:mm:ss');
      expect(result).toMatch(/^\d{2}:\d{2}:\d{2}$/);
    });
  });

  describe('formatDateTime', () => {
    it('should format date and time together', () => {
      const result = formatDateTime(testDate);
      expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/);
    });
  });

  describe('formatDayOfWeek', () => {
    it('should return day of week in Spanish', () => {
      const result = formatDayOfWeek(testDate);
      expect(result).toBe('domingo');
    });
  });

  describe('formatMonthYear', () => {
    it('should return month and year in Spanish', () => {
      const result = formatMonthYear(testDate);
      expect(result).toBe('diciembre 2024');
    });
  });
});

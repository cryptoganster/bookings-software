import { describe, it, expect } from 'vitest';
import {
  convertToTimezone,
  convertFromTimezone,
  getUserTimezone,
  getTimezoneOffset,
} from '../timezone';

describe('Timezone Utilities', () => {
  const testDate = new Date('2024-12-15T14:30:00Z');
  const timezone = 'America/Santo_Domingo';

  describe('convertToTimezone', () => {
    it('should convert UTC date to specified timezone', () => {
      const result = convertToTimezone(testDate, timezone);
      expect(result).toBeInstanceOf(Date);
    });

    it('should handle ISO string input', () => {
      const result = convertToTimezone('2024-12-15T14:30:00Z', timezone);
      expect(result).toBeInstanceOf(Date);
    });

    it('should handle timestamp input', () => {
      const result = convertToTimezone(testDate.getTime(), timezone);
      expect(result).toBeInstanceOf(Date);
    });
  });

  describe('convertFromTimezone', () => {
    it('should convert timezone date to UTC', () => {
      const result = convertFromTimezone(testDate, timezone);
      expect(result).toBeInstanceOf(Date);
    });
  });

  describe('getUserTimezone', () => {
    it('should return user timezone', () => {
      const result = getUserTimezone();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('getTimezoneOffset', () => {
    it('should return offset in minutes', () => {
      const result = getTimezoneOffset(timezone, testDate);
      expect(typeof result).toBe('number');
    });
  });
});

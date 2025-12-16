import { OfferingDuration } from '../offering-duration';
import { InvalidOfferingDurationException } from '../../exceptions/invalid-offering-duration';

describe('OfferingDuration', () => {
  describe('fromMinutes', () => {
    it('should create duration with valid minutes', () => {
      const duration = OfferingDuration.fromMinutes(30);
      expect(duration.getMinutes()).toBe(30);
    });

    it('should create duration with minimum valid value (15 minutes)', () => {
      const duration = OfferingDuration.fromMinutes(15);
      expect(duration.getMinutes()).toBe(15);
    });

    it('should create duration with maximum valid value (480 minutes)', () => {
      const duration = OfferingDuration.fromMinutes(480);
      expect(duration.getMinutes()).toBe(480);
    });

    it('should throw error if duration is not an integer', () => {
      expect(() => OfferingDuration.fromMinutes(30.5)).toThrow(InvalidOfferingDurationException);
    });

    it('should throw error if duration is less than 15 minutes', () => {
      expect(() => OfferingDuration.fromMinutes(10)).toThrow(InvalidOfferingDurationException);
    });

    it('should throw error if duration exceeds 480 minutes', () => {
      expect(() => OfferingDuration.fromMinutes(500)).toThrow(InvalidOfferingDurationException);
    });

    it('should throw error if duration is not a multiple of 15', () => {
      expect(() => OfferingDuration.fromMinutes(20)).toThrow(InvalidOfferingDurationException);
    });

    it('should accept valid multiples of 15', () => {
      const validDurations = [15, 30, 45, 60, 90, 120, 180, 240, 360, 480];

      validDurations.forEach((minutes) => {
        const duration = OfferingDuration.fromMinutes(minutes);
        expect(duration.getMinutes()).toBe(minutes);
      });
    });
  });

  describe('equals', () => {
    it('should return true for durations with same minutes', () => {
      const duration1 = OfferingDuration.fromMinutes(30);
      const duration2 = OfferingDuration.fromMinutes(30);

      expect(duration1.equals(duration2)).toBe(true);
    });

    it('should return false for durations with different minutes', () => {
      const duration1 = OfferingDuration.fromMinutes(30);
      const duration2 = OfferingDuration.fromMinutes(45);

      expect(duration1.equals(duration2)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should format minutes only when less than 1 hour', () => {
      const duration = OfferingDuration.fromMinutes(45);
      expect(duration.toString()).toBe('45 min');
    });

    it('should format hours only when exact hours', () => {
      const duration = OfferingDuration.fromMinutes(120);
      expect(duration.toString()).toBe('2h');
    });

    it('should format hours and minutes when mixed', () => {
      const duration = OfferingDuration.fromMinutes(90);
      expect(duration.toString()).toBe('1h 30min');
    });

    it('should format 8 hours correctly', () => {
      const duration = OfferingDuration.fromMinutes(480);
      expect(duration.toString()).toBe('8h');
    });
  });
});

import { OfferingCapacity } from '../offering-capacity';

describe('OfferingCapacity', () => {
  describe('create', () => {
    it('should create capacity with valid values', () => {
      const capacity = OfferingCapacity.create(4, 20);

      expect(capacity.getMaxPerSlot()).toBe(4);
      expect(capacity.getMaxDaily()).toBe(20);
    });

    it('should create capacity without daily limit', () => {
      const capacity = OfferingCapacity.create(4, null);

      expect(capacity.getMaxPerSlot()).toBe(4);
      expect(capacity.getMaxDaily()).toBeNull();
      expect(capacity.hasDailyLimit()).toBe(false);
    });

    it('should create capacity with minimum valid value (1 per slot)', () => {
      const capacity = OfferingCapacity.create(1, null);

      expect(capacity.getMaxPerSlot()).toBe(1);
    });

    it('should create capacity where maxDaily equals maxPerSlot', () => {
      const capacity = OfferingCapacity.create(5, 5);

      expect(capacity.getMaxPerSlot()).toBe(5);
      expect(capacity.getMaxDaily()).toBe(5);
    });

    it('should throw error if maxPerSlot is not an integer', () => {
      expect(() => OfferingCapacity.create(4.5, 20)).toThrow(
        'Max capacity per slot must be an integer',
      );
    });

    it('should throw error if maxPerSlot is less than 1', () => {
      expect(() => OfferingCapacity.create(0, 20)).toThrow(
        'Max capacity per slot must be at least 1',
      );
    });

    it('should throw error if maxDaily is not an integer', () => {
      expect(() => OfferingCapacity.create(4, 20.5)).toThrow(
        'Max daily capacity must be an integer',
      );
    });

    it('should throw error if maxDaily is less than maxPerSlot', () => {
      expect(() => OfferingCapacity.create(10, 5)).toThrow(
        'Max daily capacity must be greater than or equal to max capacity per slot',
      );
    });
  });

  describe('hasDailyLimit', () => {
    it('should return true when maxDaily is defined', () => {
      const capacity = OfferingCapacity.create(4, 20);

      expect(capacity.hasDailyLimit()).toBe(true);
    });

    it('should return false when maxDaily is null', () => {
      const capacity = OfferingCapacity.create(4, null);

      expect(capacity.hasDailyLimit()).toBe(false);
    });
  });

  describe('equals', () => {
    it('should return true for capacities with same values', () => {
      const capacity1 = OfferingCapacity.create(4, 20);
      const capacity2 = OfferingCapacity.create(4, 20);

      expect(capacity1.equals(capacity2)).toBe(true);
    });

    it('should return true for capacities with same values and no daily limit', () => {
      const capacity1 = OfferingCapacity.create(4, null);
      const capacity2 = OfferingCapacity.create(4, null);

      expect(capacity1.equals(capacity2)).toBe(true);
    });

    it('should return false for capacities with different maxPerSlot', () => {
      const capacity1 = OfferingCapacity.create(4, 20);
      const capacity2 = OfferingCapacity.create(5, 20);

      expect(capacity1.equals(capacity2)).toBe(false);
    });

    it('should return false for capacities with different maxDaily', () => {
      const capacity1 = OfferingCapacity.create(4, 20);
      const capacity2 = OfferingCapacity.create(4, 25);

      expect(capacity1.equals(capacity2)).toBe(false);
    });

    it('should return false when one has daily limit and other does not', () => {
      const capacity1 = OfferingCapacity.create(4, 20);
      const capacity2 = OfferingCapacity.create(4, null);

      expect(capacity1.equals(capacity2)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should format capacity with daily limit', () => {
      const capacity = OfferingCapacity.create(4, 20);

      expect(capacity.toString()).toBe('4 per slot, 20 per day');
    });

    it('should format capacity without daily limit', () => {
      const capacity = OfferingCapacity.create(4, null);

      expect(capacity.toString()).toBe('4 per slot (unlimited daily)');
    });

    it('should format capacity with equal slot and daily limits', () => {
      const capacity = OfferingCapacity.create(5, 5);

      expect(capacity.toString()).toBe('5 per slot, 5 per day');
    });
  });
});

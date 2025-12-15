import { AggregateVersion } from '../aggregate-version';

describe('AggregateVersion', () => {
  describe('constructor', () => {
    it('should create version with valid value', () => {
      const version = new AggregateVersion(0);

      expect(version.getValue()).toBe(0);
    });

    it('should throw error for negative version', () => {
      expect(() => new AggregateVersion(-1)).toThrow('Version cannot be negative');
    });
  });

  describe('increment', () => {
    it('should increment version by 1', () => {
      const version = new AggregateVersion(0);
      const incremented = version.increment();

      expect(incremented.getValue()).toBe(1);
    });

    it('should not mutate original version', () => {
      const version = new AggregateVersion(5);
      const incremented = version.increment();

      expect(version.getValue()).toBe(5);
      expect(incremented.getValue()).toBe(6);
    });

    it('should allow multiple increments', () => {
      let version = new AggregateVersion(0);
      version = version.increment();
      version = version.increment();
      version = version.increment();

      expect(version.getValue()).toBe(3);
    });
  });

  describe('getValue', () => {
    it('should return the version value', () => {
      const version = new AggregateVersion(42);

      expect(version.getValue()).toBe(42);
    });
  });

  describe('equals', () => {
    it('should return true for versions with same value', () => {
      const version1 = new AggregateVersion(5);
      const version2 = new AggregateVersion(5);

      expect(version1.equals(version2)).toBe(true);
    });

    it('should return false for versions with different values', () => {
      const version1 = new AggregateVersion(5);
      const version2 = new AggregateVersion(6);

      expect(version1.equals(version2)).toBe(false);
    });
  });
});

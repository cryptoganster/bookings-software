import { describe, it, expect } from '@jest/globals';
import { Timezone } from '../timezone';
import { InvalidTimezoneException } from '../../exceptions/invalid-timezone';

describe('Timezone Value Object', () => {
  describe('create', () => {
    it('should create Timezone with valid IANA timezone', () => {
      // Arrange & Act
      const timezone = Timezone.create('America/Santo_Domingo');

      // Assert
      expect(timezone).toBeDefined();
      expect(timezone.getValue()).toBe('America/Santo_Domingo');
    });

    it('should create Timezone with Europe/London', () => {
      // Arrange & Act
      const timezone = Timezone.create('Europe/London');

      // Assert
      expect(timezone).toBeDefined();
      expect(timezone.getValue()).toBe('Europe/London');
    });

    it('should throw InvalidTimezoneException for invalid timezone', () => {
      // Arrange & Act & Assert
      expect(() => Timezone.create('EST')).toThrow(InvalidTimezoneException);
    });

    it('should throw InvalidTimezoneException for GMT-5 format', () => {
      // Arrange & Act & Assert
      expect(() => Timezone.create('GMT-5')).toThrow(InvalidTimezoneException);
    });

    it('should throw InvalidTimezoneException for empty string', () => {
      // Arrange & Act & Assert
      expect(() => Timezone.create('')).toThrow(InvalidTimezoneException);
    });

    it('should throw InvalidTimezoneException for random string', () => {
      // Arrange & Act & Assert
      expect(() => Timezone.create('InvalidTimezone')).toThrow(InvalidTimezoneException);
    });
  });

  describe('getValue', () => {
    it('should return the timezone string', () => {
      // Arrange
      const timezone = Timezone.create('America/New_York');

      // Act
      const value = timezone.getValue();

      // Assert
      expect(value).toBe('America/New_York');
    });
  });

  describe('equals', () => {
    it('should return true for same timezone', () => {
      // Arrange
      const timezone1 = Timezone.create('America/Santo_Domingo');
      const timezone2 = Timezone.create('America/Santo_Domingo');

      // Act & Assert
      expect(timezone1.equals(timezone2)).toBe(true);
    });

    it('should return false for different timezones', () => {
      // Arrange
      const timezone1 = Timezone.create('America/Santo_Domingo');
      const timezone2 = Timezone.create('America/New_York');

      // Act & Assert
      expect(timezone1.equals(timezone2)).toBe(false);
    });
  });
});

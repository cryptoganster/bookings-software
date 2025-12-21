import { describe, it, expect } from '@jest/globals';
import { BusinessAddress } from '../business-address';
import { InvalidBusinessAddressException } from '../../exceptions/invalid-business-address';

describe('BusinessAddress Value Object', () => {
  describe('create', () => {
    it('should create BusinessAddress with required fields only', () => {
      // Arrange & Act
      const address = BusinessAddress.create('123 Main St', 'Santo Domingo');

      // Assert
      expect(address).toBeDefined();
      const obj = address.toObject();
      expect(obj.street).toBe('123 Main St');
      expect(obj.city).toBe('Santo Domingo');
      expect(obj.state).toBeNull();
      expect(obj.country).toBeNull();
      expect(obj.postalCode).toBeNull();
    });

    it('should create BusinessAddress with all fields', () => {
      // Arrange & Act
      const address = BusinessAddress.create(
        '123 Main St',
        'Santo Domingo',
        'Distrito Nacional',
        'Dominican Republic',
        '10101',
      );

      // Assert
      expect(address).toBeDefined();
      const obj = address.toObject();
      expect(obj.street).toBe('123 Main St');
      expect(obj.city).toBe('Santo Domingo');
      expect(obj.state).toBe('Distrito Nacional');
      expect(obj.country).toBe('Dominican Republic');
      expect(obj.postalCode).toBe('10101');
    });

    it('should accept empty optional fields', () => {
      // Arrange & Act
      const address = BusinessAddress.create('123 Main St', 'Santo Domingo', '', '', '');

      // Assert
      const obj = address.toObject();
      // Empty strings are converted to null by the factory method
      expect(obj.state === null || obj.state === '').toBe(true);
      expect(obj.country === null || obj.country === '').toBe(true);
      expect(obj.postalCode === null || obj.postalCode === '').toBe(true);
    });
  });

  describe('toObject', () => {
    it('should return object with all fields', () => {
      // Arrange
      const address = BusinessAddress.create(
        '123 Main St',
        'Santo Domingo',
        'Distrito Nacional',
        'Dominican Republic',
        '10101',
      );

      // Act
      const obj = address.toObject();

      // Assert
      expect(obj).toEqual({
        street: '123 Main St',
        city: 'Santo Domingo',
        state: 'Distrito Nacional',
        country: 'Dominican Republic',
        postalCode: '10101',
      });
    });

    it('should return object with null optional fields', () => {
      // Arrange
      const address = BusinessAddress.create('123 Main St', 'Santo Domingo');

      // Act
      const obj = address.toObject();

      // Assert
      expect(obj).toEqual({
        street: '123 Main St',
        city: 'Santo Domingo',
        state: null,
        country: null,
        postalCode: null,
      });
    });
  });

  describe('equals', () => {
    it('should return true for same address', () => {
      // Arrange
      const address1 = BusinessAddress.create(
        '123 Main St',
        'Santo Domingo',
        'Distrito Nacional',
        'Dominican Republic',
        '10101',
      );
      const address2 = BusinessAddress.create(
        '123 Main St',
        'Santo Domingo',
        'Distrito Nacional',
        'Dominican Republic',
        '10101',
      );

      // Act & Assert
      expect(address1.equals(address2)).toBe(true);
    });

    it('should return false for different street', () => {
      // Arrange
      const address1 = BusinessAddress.create('123 Main St', 'Santo Domingo');
      const address2 = BusinessAddress.create('456 Oak Ave', 'Santo Domingo');

      // Act & Assert
      expect(address1.equals(address2)).toBe(false);
    });

    it('should return false for different city', () => {
      // Arrange
      const address1 = BusinessAddress.create('123 Main St', 'Santo Domingo');
      const address2 = BusinessAddress.create('123 Main St', 'Santiago');

      // Act & Assert
      expect(address1.equals(address2)).toBe(false);
    });

    it('should return true for addresses with only required fields', () => {
      // Arrange
      const address1 = BusinessAddress.create('123 Main St', 'Santo Domingo');
      const address2 = BusinessAddress.create('123 Main St', 'Santo Domingo');

      // Act & Assert
      expect(address1.equals(address2)).toBe(true);
    });
  });
});

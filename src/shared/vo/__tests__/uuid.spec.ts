import { UUID } from '../uuid';
import { validate as uuidValidate } from 'uuid';

describe('UUID', () => {
  describe('generate', () => {
    it('should generate a valid UUID', () => {
      const uuid = UUID.generate();

      expect(uuidValidate(uuid.getValue())).toBe(true);
    });

    it('should generate different UUIDs', () => {
      const uuid1 = UUID.generate();
      const uuid2 = UUID.generate();

      expect(uuid1.getValue()).not.toBe(uuid2.getValue());
    });
  });

  describe('fromString', () => {
    it('should create UUID from valid string', () => {
      const validUuid = '550e8400-e29b-41d4-a716-446655440000';
      const uuid = UUID.fromString(validUuid);

      expect(uuid.getValue()).toBe(validUuid);
    });

    it('should throw error for invalid UUID string', () => {
      const invalidUuid = 'not-a-uuid';

      expect(() => UUID.fromString(invalidUuid)).toThrow('Invalid UUID');
    });

    it('should throw error for empty string', () => {
      expect(() => UUID.fromString('')).toThrow('Invalid UUID');
    });
  });

  describe('getValue', () => {
    it('should return the UUID string value', () => {
      const validUuid = '550e8400-e29b-41d4-a716-446655440000';
      const uuid = UUID.fromString(validUuid);

      expect(uuid.getValue()).toBe(validUuid);
    });
  });

  describe('toString', () => {
    it('should return the UUID string value', () => {
      const validUuid = '550e8400-e29b-41d4-a716-446655440000';
      const uuid = UUID.fromString(validUuid);

      expect(uuid.toString()).toBe(validUuid);
    });
  });

  describe('equals', () => {
    it('should return true for UUIDs with same value', () => {
      const validUuid = '550e8400-e29b-41d4-a716-446655440000';
      const uuid1 = UUID.fromString(validUuid);
      const uuid2 = UUID.fromString(validUuid);

      expect(uuid1.equals(uuid2)).toBe(true);
    });

    it('should return false for UUIDs with different values', () => {
      const uuid1 = UUID.fromString('550e8400-e29b-41d4-a716-446655440000');
      const uuid2 = UUID.fromString('550e8400-e29b-41d4-a716-446655440001');

      expect(uuid1.equals(uuid2)).toBe(false);
    });
  });
});

import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { MergeCustomersDto } from '../merge-customers.dto';

describe('MergeCustomersDto', () => {
  const validUuid = '550e8400-e29b-41d4-a716-446655440000';
  const anotherValidUuid = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

  describe('sourceCustomerId validation', () => {
    it('should accept valid UUID', async () => {
      const dto = plainToClass(MergeCustomersDto, {
        sourceCustomerId: validUuid,
        targetCustomerId: anotherValidUuid,
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should reject invalid UUID', async () => {
      const dto = plainToClass(MergeCustomersDto, {
        sourceCustomerId: 'invalid-uuid',
        targetCustomerId: anotherValidUuid,
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const sourceError = errors.find((e) => e.property === 'sourceCustomerId');
      expect(sourceError).toBeDefined();
    });

    it('should reject empty string', async () => {
      const dto = plainToClass(MergeCustomersDto, {
        sourceCustomerId: '',
        targetCustomerId: anotherValidUuid,
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const sourceError = errors.find((e) => e.property === 'sourceCustomerId');
      expect(sourceError).toBeDefined();
    });

    it('should reject undefined', async () => {
      const dto = plainToClass(MergeCustomersDto, {
        targetCustomerId: anotherValidUuid,
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const sourceError = errors.find((e) => e.property === 'sourceCustomerId');
      expect(sourceError).toBeDefined();
    });
  });

  describe('targetCustomerId validation', () => {
    it('should accept valid UUID', async () => {
      const dto = plainToClass(MergeCustomersDto, {
        sourceCustomerId: validUuid,
        targetCustomerId: anotherValidUuid,
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should reject invalid UUID', async () => {
      const dto = plainToClass(MergeCustomersDto, {
        sourceCustomerId: validUuid,
        targetCustomerId: 'invalid-uuid',
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const targetError = errors.find((e) => e.property === 'targetCustomerId');
      expect(targetError).toBeDefined();
    });

    it('should reject empty string', async () => {
      const dto = plainToClass(MergeCustomersDto, {
        sourceCustomerId: validUuid,
        targetCustomerId: '',
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const targetError = errors.find((e) => e.property === 'targetCustomerId');
      expect(targetError).toBeDefined();
    });

    it('should reject undefined', async () => {
      const dto = plainToClass(MergeCustomersDto, {
        sourceCustomerId: validUuid,
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const targetError = errors.find((e) => e.property === 'targetCustomerId');
      expect(targetError).toBeDefined();
    });
  });

  describe('both fields validation', () => {
    it('should accept when both are valid UUIDs', async () => {
      const dto = plainToClass(MergeCustomersDto, {
        sourceCustomerId: validUuid,
        targetCustomerId: anotherValidUuid,
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should reject when both are invalid', async () => {
      const dto = plainToClass(MergeCustomersDto, {
        sourceCustomerId: 'invalid-1',
        targetCustomerId: 'invalid-2',
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(2);
    });

    it('should reject when both are missing', async () => {
      const dto = plainToClass(MergeCustomersDto, {});
      const errors = await validate(dto);
      expect(errors.length).toBe(2);
    });
  });
});

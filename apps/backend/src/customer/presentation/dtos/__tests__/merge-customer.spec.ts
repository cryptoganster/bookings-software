import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { MergeCustomersDto } from '../merge-customer';

describe('MergeCustomersDto', () => {
  const validUuid1 = '123e4567-e89b-12d3-a456-426614174000';
  const validUuid2 = '123e4567-e89b-12d3-a456-426614174001';

  describe('Validation', () => {
    it('should pass validation with valid UUIDs', async () => {
      const dto = plainToInstance(MergeCustomersDto, {
        sourceCustomerId: validUuid1,
        targetCustomerId: validUuid2,
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    describe('sourceCustomerId', () => {
      it('should accept valid UUID', async () => {
        const dto = plainToInstance(MergeCustomersDto, {
          sourceCustomerId: validUuid1,
          targetCustomerId: validUuid2,
        });
        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
      });

      it('should reject invalid UUID format', async () => {
        const dto = plainToInstance(MergeCustomersDto, {
          sourceCustomerId: 'not-a-uuid',
          targetCustomerId: validUuid2,
        });
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        const sourceError = errors.find((e) => e.property === 'sourceCustomerId');
        expect(sourceError).toBeDefined();
      });

      it('should reject empty string', async () => {
        const dto = plainToInstance(MergeCustomersDto, {
          sourceCustomerId: '',
          targetCustomerId: validUuid2,
        });
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        const sourceError = errors.find((e) => e.property === 'sourceCustomerId');
        expect(sourceError).toBeDefined();
      });

      it('should reject null', async () => {
        const dto = plainToInstance(MergeCustomersDto, {
          sourceCustomerId: null,
          targetCustomerId: validUuid2,
        });
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        const sourceError = errors.find((e) => e.property === 'sourceCustomerId');
        expect(sourceError).toBeDefined();
      });

      it('should reject undefined', async () => {
        const dto = plainToInstance(MergeCustomersDto, {
          targetCustomerId: validUuid2,
        });
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        const sourceError = errors.find((e) => e.property === 'sourceCustomerId');
        expect(sourceError).toBeDefined();
      });
    });

    describe('targetCustomerId', () => {
      it('should accept valid UUID', async () => {
        const dto = plainToInstance(MergeCustomersDto, {
          sourceCustomerId: validUuid1,
          targetCustomerId: validUuid2,
        });
        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
      });

      it('should reject invalid UUID format', async () => {
        const dto = plainToInstance(MergeCustomersDto, {
          sourceCustomerId: validUuid1,
          targetCustomerId: 'not-a-uuid',
        });
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        const targetError = errors.find((e) => e.property === 'targetCustomerId');
        expect(targetError).toBeDefined();
      });

      it('should reject empty string', async () => {
        const dto = plainToInstance(MergeCustomersDto, {
          sourceCustomerId: validUuid1,
          targetCustomerId: '',
        });
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        const targetError = errors.find((e) => e.property === 'targetCustomerId');
        expect(targetError).toBeDefined();
      });

      it('should reject null', async () => {
        const dto = plainToInstance(MergeCustomersDto, {
          sourceCustomerId: validUuid1,
          targetCustomerId: null,
        });
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        const targetError = errors.find((e) => e.property === 'targetCustomerId');
        expect(targetError).toBeDefined();
      });

      it('should reject undefined', async () => {
        const dto = plainToInstance(MergeCustomersDto, {
          sourceCustomerId: validUuid1,
        });
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        const targetError = errors.find((e) => e.property === 'targetCustomerId');
        expect(targetError).toBeDefined();
      });
    });

    describe('Both fields', () => {
      it('should reject when both fields are missing', async () => {
        const dto = plainToInstance(MergeCustomersDto, {});
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThanOrEqual(2);
      });

      it('should reject when both fields are invalid', async () => {
        const dto = plainToInstance(MergeCustomersDto, {
          sourceCustomerId: 'invalid1',
          targetCustomerId: 'invalid2',
        });
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThanOrEqual(2);
      });

      it('should allow same UUID format for both (business logic will reject)', async () => {
        // Note: DTO validation allows same UUID, business logic should reject
        const dto = plainToInstance(MergeCustomersDto, {
          sourceCustomerId: validUuid1,
          targetCustomerId: validUuid1,
        });
        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
      });
    });
  });

  describe('UUID Format Variations', () => {
    it('should accept lowercase UUID', async () => {
      const dto = plainToInstance(MergeCustomersDto, {
        sourceCustomerId: '123e4567-e89b-12d3-a456-426614174000',
        targetCustomerId: '123e4567-e89b-12d3-a456-426614174001',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should accept uppercase UUID', async () => {
      const dto = plainToInstance(MergeCustomersDto, {
        sourceCustomerId: '123E4567-E89B-12D3-A456-426614174000',
        targetCustomerId: '123E4567-E89B-12D3-A456-426614174001',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should accept mixed case UUID', async () => {
      const dto = plainToInstance(MergeCustomersDto, {
        sourceCustomerId: '123e4567-E89B-12d3-A456-426614174000',
        targetCustomerId: '123E4567-e89b-12D3-a456-426614174001',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should reject UUID without hyphens', async () => {
      const dto = plainToInstance(MergeCustomersDto, {
        sourceCustomerId: '123e4567e89b12d3a456426614174000',
        targetCustomerId: validUuid2,
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should reject UUID with wrong length', async () => {
      const dto = plainToInstance(MergeCustomersDto, {
        sourceCustomerId: '123e4567-e89b-12d3-a456-42661417400',
        targetCustomerId: validUuid2,
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });
});

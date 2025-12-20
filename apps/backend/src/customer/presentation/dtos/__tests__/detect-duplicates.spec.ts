import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { DetectDuplicatesDto } from '../detect-duplicates';

describe('DetectDuplicatesDto', () => {
  describe('Validation', () => {
    it('should pass validation with default value', async () => {
      const dto = plainToInstance(DetectDuplicatesDto, {});
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with valid threshold', async () => {
      const dto = plainToInstance(DetectDuplicatesDto, {
        threshold: 0.75,
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    describe('threshold', () => {
      it('should accept threshold = 0 (min)', async () => {
        const dto = plainToInstance(DetectDuplicatesDto, {
          threshold: 0,
        });
        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
      });

      it('should accept threshold = 1 (max)', async () => {
        const dto = plainToInstance(DetectDuplicatesDto, {
          threshold: 1,
        });
        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
      });

      it('should accept threshold = 0.5 (middle)', async () => {
        const dto = plainToInstance(DetectDuplicatesDto, {
          threshold: 0.5,
        });
        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
      });

      it('should reject threshold < 0', async () => {
        const dto = plainToInstance(DetectDuplicatesDto, {
          threshold: -0.1,
        });
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].property).toBe('threshold');
      });

      it('should reject threshold > 1', async () => {
        const dto = plainToInstance(DetectDuplicatesDto, {
          threshold: 1.1,
        });
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].property).toBe('threshold');
      });

      it('should reject non-numeric threshold', async () => {
        const dto = plainToInstance(DetectDuplicatesDto, {
          threshold: 'not-a-number',
        });
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].property).toBe('threshold');
      });

      it('should transform string to number', async () => {
        const dto = plainToInstance(DetectDuplicatesDto, {
          threshold: '0.85',
        });
        expect(dto.threshold).toBe(0.85);
        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
      });

      it('should accept very small positive threshold', async () => {
        const dto = plainToInstance(DetectDuplicatesDto, {
          threshold: 0.001,
        });
        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
      });

      it('should accept threshold very close to 1', async () => {
        const dto = plainToInstance(DetectDuplicatesDto, {
          threshold: 0.999,
        });
        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
      });
    });
  });

  describe('Default Value', () => {
    it('should have default threshold = 0.8', () => {
      const dto = new DetectDuplicatesDto();
      expect(dto.threshold).toBe(0.8);
    });

    it('should use default when threshold is undefined', async () => {
      const dto = plainToInstance(DetectDuplicatesDto, {});
      expect(dto.threshold).toBe(0.8);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null threshold (uses default)', async () => {
      const dto = plainToInstance(DetectDuplicatesDto, {
        threshold: null,
      });
      // @IsOptional() allows null, and default value is used
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      // Null is allowed by @IsOptional()
    });

    it('should handle boolean threshold', async () => {
      const dto = plainToInstance(DetectDuplicatesDto, {
        threshold: true,
      });
      // Note: class-transformer converts true to 1
      // This passes validation as 1 is within range [0, 1]
      expect(dto.threshold).toBe(1);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should handle array threshold', async () => {
      const dto = plainToInstance(DetectDuplicatesDto, {
        threshold: [0.8],
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('threshold');
    });

    it('should handle object threshold', async () => {
      const dto = plainToInstance(DetectDuplicatesDto, {
        threshold: { value: 0.8 },
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('threshold');
    });
  });

  describe('Precision', () => {
    it('should handle high precision decimals', async () => {
      const dto = plainToInstance(DetectDuplicatesDto, {
        threshold: 0.123456789,
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.threshold).toBe(0.123456789);
    });

    it('should handle scientific notation', async () => {
      const dto = plainToInstance(DetectDuplicatesDto, {
        threshold: 5e-1, // 0.5
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.threshold).toBe(0.5);
    });
  });

  describe('Boundary Testing', () => {
    const validThresholds = [0, 0.1, 0.25, 0.5, 0.75, 0.8, 0.9, 0.99, 1];
    const invalidThresholds = [-1, -0.1, 1.1, 2, 100];

    validThresholds.forEach((threshold) => {
      it(`should accept valid threshold: ${threshold}`, async () => {
        const dto = plainToInstance(DetectDuplicatesDto, { threshold });
        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
      });
    });

    invalidThresholds.forEach((threshold) => {
      it(`should reject invalid threshold: ${threshold}`, async () => {
        const dto = plainToInstance(DetectDuplicatesDto, { threshold });
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].property).toBe('threshold');
      });
    });
  });
});

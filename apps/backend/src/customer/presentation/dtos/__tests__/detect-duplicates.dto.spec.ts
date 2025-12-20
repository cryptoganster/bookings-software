import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { DetectDuplicatesDto } from '../detect-duplicates.dto';

describe('DetectDuplicatesDto', () => {
  describe('threshold validation', () => {
    it('should accept value 0', async () => {
      const dto = plainToClass(DetectDuplicatesDto, { threshold: '0' });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
      expect(dto.threshold).toBe(0);
    });

    it('should accept value 1', async () => {
      const dto = plainToClass(DetectDuplicatesDto, { threshold: '1' });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
      expect(dto.threshold).toBe(1);
    });

    it('should accept value between 0 and 1', async () => {
      const dto = plainToClass(DetectDuplicatesDto, { threshold: '0.75' });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
      expect(dto.threshold).toBe(0.75);
    });

    it('should reject value less than 0', async () => {
      const dto = plainToClass(DetectDuplicatesDto, { threshold: '-0.1' });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('threshold');
    });

    it('should reject value greater than 1', async () => {
      const dto = plainToClass(DetectDuplicatesDto, { threshold: '1.1' });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('threshold');
    });

    it('should use default value 0.8 when not provided', () => {
      const dto = plainToClass(DetectDuplicatesDto, {});
      expect(dto.threshold).toBe(0.8);
    });

    it('should accept undefined (optional)', async () => {
      const dto = plainToClass(DetectDuplicatesDto, {});
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });

  describe('type transformation', () => {
    it('should transform string to number', () => {
      const dto = plainToClass(DetectDuplicatesDto, { threshold: '0.9' });
      expect(typeof dto.threshold).toBe('number');
      expect(dto.threshold).toBe(0.9);
    });
  });
});

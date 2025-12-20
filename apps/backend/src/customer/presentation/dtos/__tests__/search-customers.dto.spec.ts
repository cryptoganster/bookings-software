import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { SearchCustomersDto } from '../search-customers.dto';

describe('SearchCustomersDto', () => {
  describe('searchText validation', () => {
    it('should accept valid string', async () => {
      const dto = plainToClass(SearchCustomersDto, { searchText: 'Juan' });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should accept undefined (optional)', async () => {
      const dto = plainToClass(SearchCustomersDto, {});
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });

  describe('type validation', () => {
    it('should accept "anonymous"', async () => {
      const dto = plainToClass(SearchCustomersDto, { type: 'anonymous' });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should accept "registered"', async () => {
      const dto = plainToClass(SearchCustomersDto, { type: 'registered' });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should reject invalid type', async () => {
      const dto = plainToClass(SearchCustomersDto, { type: 'invalid' });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('type');
    });
  });

  describe('page validation', () => {
    it('should accept positive integer', async () => {
      const dto = plainToClass(SearchCustomersDto, { page: '5' });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
      expect(dto.page).toBe(5);
    });

    it('should reject zero', async () => {
      const dto = plainToClass(SearchCustomersDto, { page: '0' });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('page');
    });

    it('should reject negative number', async () => {
      const dto = plainToClass(SearchCustomersDto, { page: '-1' });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('page');
    });

    it('should use default value 1 when not provided', () => {
      const dto = plainToClass(SearchCustomersDto, {});
      expect(dto.page).toBe(1);
    });
  });

  describe('limit validation', () => {
    it('should accept value between 1 and 100', async () => {
      const dto = plainToClass(SearchCustomersDto, { limit: '50' });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
      expect(dto.limit).toBe(50);
    });

    it('should reject value greater than 100', async () => {
      const dto = plainToClass(SearchCustomersDto, { limit: '101' });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('limit');
    });

    it('should reject zero', async () => {
      const dto = plainToClass(SearchCustomersDto, { limit: '0' });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('limit');
    });

    it('should use default value 10 when not provided', () => {
      const dto = plainToClass(SearchCustomersDto, {});
      expect(dto.limit).toBe(10);
    });
  });

  describe('sortBy validation', () => {
    it('should accept "name"', async () => {
      const dto = plainToClass(SearchCustomersDto, { sortBy: 'name' });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should accept "createdAt"', async () => {
      const dto = plainToClass(SearchCustomersDto, { sortBy: 'createdAt' });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should accept "appointmentCount"', async () => {
      const dto = plainToClass(SearchCustomersDto, { sortBy: 'appointmentCount' });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should reject invalid sortBy', async () => {
      const dto = plainToClass(SearchCustomersDto, { sortBy: 'invalid' });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('sortBy');
    });

    it('should use default value "createdAt" when not provided', () => {
      const dto = plainToClass(SearchCustomersDto, {});
      expect(dto.sortBy).toBe('createdAt');
    });
  });

  describe('sortOrder validation', () => {
    it('should accept "asc"', async () => {
      const dto = plainToClass(SearchCustomersDto, { sortOrder: 'asc' });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should accept "desc"', async () => {
      const dto = plainToClass(SearchCustomersDto, { sortOrder: 'desc' });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should reject invalid sortOrder', async () => {
      const dto = plainToClass(SearchCustomersDto, { sortOrder: 'invalid' });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('sortOrder');
    });

    it('should use default value "desc" when not provided', () => {
      const dto = plainToClass(SearchCustomersDto, {});
      expect(dto.sortOrder).toBe('desc');
    });
  });

  describe('type transformation', () => {
    it('should transform string to number for page', () => {
      const dto = plainToClass(SearchCustomersDto, { page: '5' });
      expect(typeof dto.page).toBe('number');
      expect(dto.page).toBe(5);
    });

    it('should transform string to number for limit', () => {
      const dto = plainToClass(SearchCustomersDto, { limit: '20' });
      expect(typeof dto.limit).toBe('number');
      expect(dto.limit).toBe(20);
    });
  });
});

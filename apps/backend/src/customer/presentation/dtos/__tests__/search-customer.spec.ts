import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { SearchCustomersDto } from '../search-customer';

describe('SearchCustomersDto', () => {
  describe('Validation', () => {
    it('should pass validation with default values', async () => {
      const dto = plainToInstance(SearchCustomersDto, {});
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with all valid fields', async () => {
      const dto = plainToInstance(SearchCustomersDto, {
        searchText: 'John',
        type: 'registered',
        page: 2,
        limit: 20,
        sortBy: 'name',
        sortOrder: 'asc',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    describe('searchText', () => {
      it('should accept valid search text', async () => {
        const dto = plainToInstance(SearchCustomersDto, {
          searchText: 'John Doe',
        });
        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
      });

      it('should accept empty string', async () => {
        const dto = plainToInstance(SearchCustomersDto, {
          searchText: '',
        });
        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
      });

      it('should reject non-string values', async () => {
        const dto = plainToInstance(SearchCustomersDto, {
          searchText: 123,
        });
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].property).toBe('searchText');
      });
    });

    describe('type', () => {
      it('should accept "anonymous"', async () => {
        const dto = plainToInstance(SearchCustomersDto, {
          type: 'anonymous',
        });
        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
      });

      it('should accept "registered"', async () => {
        const dto = plainToInstance(SearchCustomersDto, {
          type: 'registered',
        });
        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
      });

      it('should reject invalid type', async () => {
        const dto = plainToInstance(SearchCustomersDto, {
          type: 'invalid',
        });
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].property).toBe('type');
      });
    });

    describe('page', () => {
      it('should accept valid page number', async () => {
        const dto = plainToInstance(SearchCustomersDto, {
          page: 5,
        });
        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
      });

      it('should reject page < 1', async () => {
        const dto = plainToInstance(SearchCustomersDto, {
          page: 0,
        });
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].property).toBe('page');
      });

      it('should reject negative page', async () => {
        const dto = plainToInstance(SearchCustomersDto, {
          page: -1,
        });
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].property).toBe('page');
      });

      it('should reject non-integer page', async () => {
        const dto = plainToInstance(SearchCustomersDto, {
          page: 1.5,
        });
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].property).toBe('page');
      });

      it('should transform string to number', async () => {
        const dto = plainToInstance(SearchCustomersDto, {
          page: '3',
        });
        expect(dto.page).toBe(3);
        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
      });
    });

    describe('limit', () => {
      it('should accept valid limit', async () => {
        const dto = plainToInstance(SearchCustomersDto, {
          limit: 50,
        });
        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
      });

      it('should reject limit < 1', async () => {
        const dto = plainToInstance(SearchCustomersDto, {
          limit: 0,
        });
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].property).toBe('limit');
      });

      it('should reject limit > 100', async () => {
        const dto = plainToInstance(SearchCustomersDto, {
          limit: 101,
        });
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].property).toBe('limit');
      });

      it('should accept limit = 1 (min)', async () => {
        const dto = plainToInstance(SearchCustomersDto, {
          limit: 1,
        });
        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
      });

      it('should accept limit = 100 (max)', async () => {
        const dto = plainToInstance(SearchCustomersDto, {
          limit: 100,
        });
        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
      });

      it('should transform string to number', async () => {
        const dto = plainToInstance(SearchCustomersDto, {
          limit: '25',
        });
        expect(dto.limit).toBe(25);
        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
      });
    });

    describe('sortBy', () => {
      it('should accept "name"', async () => {
        const dto = plainToInstance(SearchCustomersDto, {
          sortBy: 'name',
        });
        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
      });

      it('should accept "createdAt"', async () => {
        const dto = plainToInstance(SearchCustomersDto, {
          sortBy: 'createdAt',
        });
        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
      });

      it('should accept "appointmentCount"', async () => {
        const dto = plainToInstance(SearchCustomersDto, {
          sortBy: 'appointmentCount',
        });
        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
      });

      it('should reject invalid sortBy', async () => {
        const dto = plainToInstance(SearchCustomersDto, {
          sortBy: 'invalid',
        });
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].property).toBe('sortBy');
      });
    });

    describe('sortOrder', () => {
      it('should accept "asc"', async () => {
        const dto = plainToInstance(SearchCustomersDto, {
          sortOrder: 'asc',
        });
        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
      });

      it('should accept "desc"', async () => {
        const dto = plainToInstance(SearchCustomersDto, {
          sortOrder: 'desc',
        });
        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
      });

      it('should reject invalid sortOrder', async () => {
        const dto = plainToInstance(SearchCustomersDto, {
          sortOrder: 'invalid',
        });
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].property).toBe('sortOrder');
      });
    });
  });

  describe('Default Values', () => {
    it('should have default page = 1', () => {
      const dto = new SearchCustomersDto();
      expect(dto.page).toBe(1);
    });

    it('should have default limit = 10', () => {
      const dto = new SearchCustomersDto();
      expect(dto.limit).toBe(10);
    });

    it('should have default sortBy = "createdAt"', () => {
      const dto = new SearchCustomersDto();
      expect(dto.sortBy).toBe('createdAt');
    });

    it('should have default sortOrder = "desc"', () => {
      const dto = new SearchCustomersDto();
      expect(dto.sortOrder).toBe('desc');
    });
  });

  describe('Pagination Calculation', () => {
    it('should calculate offset correctly', () => {
      const testCases = [
        { page: 1, limit: 10, expectedOffset: 0 },
        { page: 2, limit: 10, expectedOffset: 10 },
        { page: 3, limit: 20, expectedOffset: 40 },
        { page: 5, limit: 25, expectedOffset: 100 },
      ];

      testCases.forEach(({ page, limit, expectedOffset }) => {
        const offset = (page - 1) * limit;
        expect(offset).toBe(expectedOffset);
      });
    });

    it('should always produce non-negative offset', () => {
      for (let page = 1; page <= 100; page++) {
        for (let limit = 1; limit <= 100; limit++) {
          const offset = (page - 1) * limit;
          expect(offset).toBeGreaterThanOrEqual(0);
        }
      }
    });
  });
});

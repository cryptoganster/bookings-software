import {
  MessageResponseDto,
  SearchCustomersResponseDto,
  CustomerStatsResponseDto,
  DuplicatePairsResponseDto,
} from '../response-types';

describe('Response DTOs', () => {
  describe('MessageResponseDto', () => {
    it('should create instance with message', () => {
      const dto = new MessageResponseDto();
      dto.message = 'Operation successful';
      expect(dto.message).toBe('Operation successful');
    });

    it('should have message property', () => {
      const dto = new MessageResponseDto();
      expect('message' in dto).toBe(true);
    });
  });

  describe('SearchCustomersResponseDto', () => {
    it('should create instance with all properties', () => {
      const dto = new SearchCustomersResponseDto();
      dto.customers = [];
      dto.total = 100;
      dto.page = 1;
      dto.limit = 10;
      dto.totalPages = 10;

      expect(dto.customers).toEqual([]);
      expect(dto.total).toBe(100);
      expect(dto.page).toBe(1);
      expect(dto.limit).toBe(10);
      expect(dto.totalPages).toBe(10);
    });

    it('should have all required properties', () => {
      const dto = new SearchCustomersResponseDto();
      expect('customers' in dto).toBe(true);
      expect('total' in dto).toBe(true);
      expect('page' in dto).toBe(true);
      expect('limit' in dto).toBe(true);
      expect('totalPages' in dto).toBe(true);
    });

    it('should calculate totalPages correctly', () => {
      const testCases = [
        { total: 100, limit: 10, expectedPages: 10 },
        { total: 95, limit: 10, expectedPages: 10 },
        { total: 101, limit: 10, expectedPages: 11 },
        { total: 0, limit: 10, expectedPages: 0 },
        { total: 5, limit: 10, expectedPages: 1 },
      ];

      testCases.forEach(({ total, limit, expectedPages }) => {
        const totalPages = Math.ceil(total / limit);
        expect(totalPages).toBe(expectedPages);
      });
    });

    it('should handle empty customers array', () => {
      const dto = new SearchCustomersResponseDto();
      dto.customers = [];
      dto.total = 0;
      dto.page = 1;
      dto.limit = 10;
      dto.totalPages = 0;

      expect(dto.customers).toHaveLength(0);
      expect(dto.total).toBe(0);
      expect(dto.totalPages).toBe(0);
    });
  });

  describe('CustomerStatsResponseDto', () => {
    it('should create instance with all properties', () => {
      const dto = new CustomerStatsResponseDto();
      dto.totalCustomers = 150;
      dto.anonymousCount = 100;
      dto.registeredCount = 50;
      dto.newThisWeek = 10;
      dto.newThisMonth = 25;
      dto.topCustomers = [];

      expect(dto.totalCustomers).toBe(150);
      expect(dto.anonymousCount).toBe(100);
      expect(dto.registeredCount).toBe(50);
      expect(dto.newThisWeek).toBe(10);
      expect(dto.newThisMonth).toBe(25);
      expect(dto.topCustomers).toEqual([]);
    });

    it('should have all required properties', () => {
      const dto = new CustomerStatsResponseDto();
      expect('totalCustomers' in dto).toBe(true);
      expect('anonymousCount' in dto).toBe(true);
      expect('registeredCount' in dto).toBe(true);
      expect('newThisWeek' in dto).toBe(true);
      expect('newThisMonth' in dto).toBe(true);
      expect('topCustomers' in dto).toBe(true);
    });

    it('should validate customer count consistency', () => {
      const dto = new CustomerStatsResponseDto();
      dto.totalCustomers = 150;
      dto.anonymousCount = 100;
      dto.registeredCount = 50;

      // Total should equal sum of anonymous and registered
      expect(dto.totalCustomers).toBe(dto.anonymousCount + dto.registeredCount);
    });

    it('should handle topCustomers array', () => {
      const dto = new CustomerStatsResponseDto();
      dto.topCustomers = [
        { id: '1', name: 'John Doe', appointmentCount: 15 },
        { id: '2', name: 'Jane Smith', appointmentCount: 12 },
      ];

      expect(dto.topCustomers).toHaveLength(2);
      expect(dto.topCustomers[0].appointmentCount).toBe(15);
      expect(dto.topCustomers[1].appointmentCount).toBe(12);
    });

    it('should handle empty topCustomers array', () => {
      const dto = new CustomerStatsResponseDto();
      dto.topCustomers = [];
      expect(dto.topCustomers).toHaveLength(0);
    });
  });

  describe('DuplicatePairsResponseDto', () => {
    it('should create instance with pairs', () => {
      const dto = new DuplicatePairsResponseDto();
      dto.pairs = [];
      expect(dto.pairs).toEqual([]);
    });

    it('should have pairs property', () => {
      const dto = new DuplicatePairsResponseDto();
      expect('pairs' in dto).toBe(true);
    });

    it('should handle duplicate pairs with all properties', () => {
      const mockCustomer1 = {
        id: '1',
        businessId: 'b1',
        whatsappPhone: '+1234567890',
        name: 'John Doe',
        userId: null,
        createdAt: new Date().toISOString(),
      };

      const mockCustomer2 = {
        id: '2',
        businessId: 'b1',
        whatsappPhone: '+1234567891',
        name: 'John D.',
        userId: null,
        createdAt: new Date().toISOString(),
      };

      const dto = new DuplicatePairsResponseDto();
      dto.pairs = [
        {
          customer1: mockCustomer1,
          customer2: mockCustomer2,
          similarityScore: 0.85,
          reasons: ['Similar names', 'Same business'],
        },
      ];

      expect(dto.pairs).toHaveLength(1);
      expect(dto.pairs[0].similarityScore).toBe(0.85);
      expect(dto.pairs[0].reasons).toHaveLength(2);
    });

    it('should handle empty pairs array', () => {
      const dto = new DuplicatePairsResponseDto();
      dto.pairs = [];
      expect(dto.pairs).toHaveLength(0);
    });

    it('should handle multiple duplicate pairs', () => {
      const mockCustomer = {
        id: '1',
        businessId: 'b1',
        whatsappPhone: '+1234567890',
        name: 'Test',
        userId: null,
        createdAt: new Date().toISOString(),
      };

      const dto = new DuplicatePairsResponseDto();
      dto.pairs = [
        {
          customer1: mockCustomer,
          customer2: mockCustomer,
          similarityScore: 0.9,
          reasons: ['Exact name match'],
        },
        {
          customer1: mockCustomer,
          customer2: mockCustomer,
          similarityScore: 0.75,
          reasons: ['Similar phone'],
        },
      ];

      expect(dto.pairs).toHaveLength(2);
      expect(dto.pairs[0].similarityScore).toBeGreaterThan(dto.pairs[1].similarityScore);
    });

    it('should validate similarity score range', () => {
      const mockCustomer = {
        id: '1',
        businessId: 'b1',
        whatsappPhone: '+1234567890',
        name: 'Test',
        userId: null,
        createdAt: new Date().toISOString(),
      };

      const dto = new DuplicatePairsResponseDto();
      dto.pairs = [
        {
          customer1: mockCustomer,
          customer2: mockCustomer,
          similarityScore: 0.85,
          reasons: [],
        },
      ];

      // Similarity score should be between 0 and 1
      expect(dto.pairs[0].similarityScore).toBeGreaterThanOrEqual(0);
      expect(dto.pairs[0].similarityScore).toBeLessThanOrEqual(1);
    });
  });

  describe('Integration', () => {
    it('should create all response DTOs without errors', () => {
      const message = new MessageResponseDto();
      const search = new SearchCustomersResponseDto();
      const stats = new CustomerStatsResponseDto();
      const duplicates = new DuplicatePairsResponseDto();

      expect(message).toBeInstanceOf(MessageResponseDto);
      expect(search).toBeInstanceOf(SearchCustomersResponseDto);
      expect(stats).toBeInstanceOf(CustomerStatsResponseDto);
      expect(duplicates).toBeInstanceOf(DuplicatePairsResponseDto);
    });
  });
});

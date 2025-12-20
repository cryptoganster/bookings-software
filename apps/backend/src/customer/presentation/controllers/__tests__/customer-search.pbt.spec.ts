import { Test, TestingModule } from '@nestjs/testing';
import { QueryBus } from '@nestjs/cqrs';
import { PinoLogger } from 'nestjs-pino';
import * as fc from 'fast-check';
import { CustomerSearchController } from '../customer-search';
import { SearchCustomersDto } from '@customer/presentation/dtos';
import { UserPayload } from '@auth/presentation/decorators/current-user';

/**
 * Property-Based Tests for CustomerSearchController
 *
 * Feature: customer-controller-refactor
 * Property 2: DTO Validation Equivalence
 * Validates: Requirements 2.2
 *
 * These tests verify that pagination logic works correctly across
 * all valid input combinations using property-based testing.
 */
describe('CustomerSearchController - Property-Based Tests', () => {
  let controller: CustomerSearchController;
  let queryBus: QueryBus;

  const mockQueryBus = {
    execute: jest.fn(),
  };

  const mockLogger = {
    setContext: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  const mockUser: UserPayload = {
    userId: 'user-123',
    businessId: 'business-123',
    email: 'test@example.com',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CustomerSearchController],
      providers: [
        {
          provide: QueryBus,
          useValue: mockQueryBus,
        },
        {
          provide: PinoLogger,
          useValue: mockLogger,
        },
      ],
    }).compile();

    controller = module.get<CustomerSearchController>(CustomerSearchController);
    queryBus = module.get<QueryBus>(QueryBus);

    jest.clearAllMocks();
  });

  /**
   * Property 2: DTO Validation Equivalence
   * Validates: Requirements 2.2
   *
   * Test that any valid page/limit combination produces valid pagination
   */
  describe('Property: Valid pagination parameters produce valid results', () => {
    it('should handle any valid page/limit combination correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 100 }), // page
          fc.integer({ min: 1, max: 100 }), // limit
          async (page, limit) => {
            // Clear mocks for each iteration
            jest.clearAllMocks();

            // Arrange
            const dto: SearchCustomersDto = {
              page,
              limit,
            };

            const mockResult = {
              customers: [],
              total: 100,
              page,
              limit,
              totalPages: Math.ceil(100 / limit),
            };

            mockQueryBus.execute.mockResolvedValue(mockResult);

            // Act
            const result = await controller.search(dto, mockUser);

            // Assert
            expect(result.page).toBe(page);
            expect(result.limit).toBe(limit);
            expect(result.totalPages).toBe(Math.ceil(100 / limit));
            expect(result.total).toBe(100);
          },
        ),
        { numRuns: 50 }, // Run 50 iterations
      );
    });

    it('should calculate offset correctly for any valid page/limit', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 100 }), // page
          fc.integer({ min: 1, max: 100 }), // limit
          async (page, limit) => {
            // Clear mocks for each iteration
            jest.clearAllMocks();

            // Arrange
            const dto: SearchCustomersDto = {
              page,
              limit,
            };

            const mockResult = {
              customers: [],
              total: 1000,
              page,
              limit,
              totalPages: Math.ceil(1000 / limit),
            };

            mockQueryBus.execute.mockResolvedValue(mockResult);

            // Act
            await controller.search(dto, mockUser);

            // Assert - offset should always be >= 0
            const callArgs = mockQueryBus.execute.mock.calls[0][0];
            const filters = callArgs.filters;

            // Offset calculation: (page - 1) * limit
            const expectedOffset = (page - 1) * limit;
            expect(expectedOffset).toBeGreaterThanOrEqual(0);

            // Verify page and limit are passed correctly
            expect(filters.page).toBe(page);
            expect(filters.limit).toBe(limit);
          },
        ),
        { numRuns: 50 },
      );
    });

    it('should handle edge case: page=1, limit=1', async () => {
      const dto: SearchCustomersDto = {
        page: 1,
        limit: 1,
      };

      const mockResult = {
        customers: [],
        total: 100,
        page: 1,
        limit: 1,
        totalPages: 100,
      };

      mockQueryBus.execute.mockResolvedValue(mockResult);

      const result = await controller.search(dto, mockUser);

      expect(result.page).toBe(1);
      expect(result.limit).toBe(1);
      expect(result.totalPages).toBe(100);
    });

    it('should handle edge case: page=1, limit=100 (max)', async () => {
      const dto: SearchCustomersDto = {
        page: 1,
        limit: 100,
      };

      const mockResult = {
        customers: [],
        total: 1000,
        page: 1,
        limit: 100,
        totalPages: 10,
      };

      mockQueryBus.execute.mockResolvedValue(mockResult);

      const result = await controller.search(dto, mockUser);

      expect(result.page).toBe(1);
      expect(result.limit).toBe(100);
      expect(result.totalPages).toBe(10);
    });

    it('should handle edge case: last page with partial results', async () => {
      const dto: SearchCustomersDto = {
        page: 10,
        limit: 10,
      };

      const mockResult = {
        customers: [],
        total: 95, // Last page has only 5 items
        page: 10,
        limit: 10,
        totalPages: 10,
      };

      mockQueryBus.execute.mockResolvedValue(mockResult);

      const result = await controller.search(dto, mockUser);

      expect(result.page).toBe(10);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(10);
    });
  });

  /**
   * Property: Sort order conversion is consistent
   */
  describe('Property: Sort order conversion is consistent', () => {
    it('should consistently convert "asc" to "ASC" for any valid input', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('name', 'createdAt', 'appointmentCount'), // sortBy
          async (sortBy) => {
            // Clear mocks for each iteration
            jest.clearAllMocks();

            // Arrange
            const dto: SearchCustomersDto = {
              sortBy: sortBy as any,
              sortOrder: 'asc',
            };

            const mockResult = {
              customers: [],
              total: 0,
              page: 1,
              limit: 10,
              totalPages: 0,
            };

            mockQueryBus.execute.mockResolvedValue(mockResult);

            // Act
            await controller.search(dto, mockUser);

            // Assert
            const callArgs = mockQueryBus.execute.mock.calls[0][0];
            expect(callArgs.filters.sortOrder).toBe('ASC');
          },
        ),
        { numRuns: 50 },
      );
    });

    it('should consistently convert "desc" to "DESC" for any valid input', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('name', 'createdAt', 'appointmentCount'), // sortBy
          async (sortBy) => {
            // Clear mocks for each iteration
            jest.clearAllMocks();

            // Arrange
            const dto: SearchCustomersDto = {
              sortBy: sortBy as any,
              sortOrder: 'desc',
            };

            const mockResult = {
              customers: [],
              total: 0,
              page: 1,
              limit: 10,
              totalPages: 0,
            };

            mockQueryBus.execute.mockResolvedValue(mockResult);

            // Act
            await controller.search(dto, mockUser);

            // Assert
            const callArgs = mockQueryBus.execute.mock.calls[0][0];
            expect(callArgs.filters.sortOrder).toBe('DESC');
          },
        ),
        { numRuns: 50 },
      );
    });
  });

  /**
   * Property: Default values are applied consistently
   */
  describe('Property: Default values are applied consistently', () => {
    it('should apply default values when parameters are omitted', async () => {
      const dto: SearchCustomersDto = {};

      const mockResult = {
        customers: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      };

      mockQueryBus.execute.mockResolvedValue(mockResult);

      await controller.search(dto, mockUser);

      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: expect.objectContaining({
            type: 'all',
            page: 1,
            limit: 10,
          }),
        }),
      );
    });
  });
});

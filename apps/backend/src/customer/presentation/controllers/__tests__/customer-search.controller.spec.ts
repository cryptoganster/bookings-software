import { Test, TestingModule } from '@nestjs/testing';
import { QueryBus } from '@nestjs/cqrs';
import { ForbiddenException } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { CustomerSearchController } from '../customer-search';
import {
  SearchCustomersDto,
  SearchCustomersResponseDto,
  CustomerStatsResponseDto,
} from '@customer/presentation/dtos';
import { UserPayload } from '@auth/presentation/decorators/current-user';
import {
  SearchCustomersQuery,
  SearchCustomersFilters,
} from '@customer/app/queries/search-customers/query';
import { GetCustomerStatsQuery } from '@customer/app/queries/get-customer-stats/query';

describe('CustomerSearchController', () => {
  let controller: CustomerSearchController;
  let queryBus: QueryBus;
  let logger: PinoLogger;

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
    logger = module.get<PinoLogger>(PinoLogger);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('search', () => {
    const mockSearchDto: SearchCustomersDto = {
      searchText: 'John',
      type: 'registered',
      page: 1,
      limit: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    };

    const mockQueryResult = {
      customers: [
        {
          id: 'customer-1',
          businessId: 'business-123',
          userId: 'user-456',
          whatsappPhone: '+1234567890',
          name: 'John Doe',
          appointmentCount: 5,
          createdAt: new Date('2024-01-01'),
        },
      ],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    };

    it('should search customers successfully with valid filters', async () => {
      mockQueryBus.execute.mockResolvedValue(mockQueryResult);

      const result = await controller.search(mockSearchDto, mockUser);

      expect(result).toEqual({
        customers: [
          {
            id: 'customer-1',
            businessId: 'business-123',
            userId: 'user-456',
            whatsappPhone: '+1234567890',
            name: 'John Doe',
            appointmentCount: 5,
            createdAt: '2024-01-01T00:00:00.000Z',
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      });

      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: expect.objectContaining({
            businessId: 'business-123',
            searchText: 'John',
            type: 'registered',
            page: 1,
            limit: 10,
            sortBy: 'createdAt',
            sortOrder: 'DESC',
          }),
        }),
      );

      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'search_customers_start',
        }),
        'Starting customer search',
      );

      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'search_customers_complete',
          resultCount: 1,
        }),
        'Customer search completed',
      );
    });

    it('should throw ForbiddenException when user has no businessId', async () => {
      const userWithoutBusiness: UserPayload = {
        userId: 'user-123',
        businessId: undefined as any,
        email: 'test@example.com',
      };

      await expect(controller.search(mockSearchDto, userWithoutBusiness)).rejects.toThrow(
        ForbiddenException,
      );

      expect(logger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'search_customers_forbidden',
          reason: 'no_business_id',
        }),
        'User does not have a business',
      );

      expect(queryBus.execute).not.toHaveBeenCalled();
    });

    it('should use default values when optional params are not provided', async () => {
      const minimalDto: SearchCustomersDto = {};
      mockQueryBus.execute.mockResolvedValue(mockQueryResult);

      await controller.search(minimalDto, mockUser);

      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: expect.objectContaining({
            businessId: 'business-123',
            type: 'all',
            page: 1,
            limit: 10,
          }),
        }),
      );
    });

    it('should convert sortOrder "asc" to "ASC"', async () => {
      const dtoWithAsc: SearchCustomersDto = {
        sortOrder: 'asc',
      };
      mockQueryBus.execute.mockResolvedValue(mockQueryResult);

      await controller.search(dtoWithAsc, mockUser);

      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: expect.objectContaining({
            sortOrder: 'ASC',
          }),
        }),
      );
    });

    it('should convert sortOrder "desc" to "DESC"', async () => {
      const dtoWithDesc: SearchCustomersDto = {
        sortOrder: 'desc',
      };
      mockQueryBus.execute.mockResolvedValue(mockQueryResult);

      await controller.search(dtoWithDesc, mockUser);

      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: expect.objectContaining({
            sortOrder: 'DESC',
          }),
        }),
      );
    });

    it('should log error and rethrow when query fails', async () => {
      const error = new Error('Database connection failed');
      mockQueryBus.execute.mockRejectedValue(error);

      await expect(controller.search(mockSearchDto, mockUser)).rejects.toThrow(error);

      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'search_customers_error',
          error: 'Database connection failed',
        }),
        'Customer search failed',
      );
    });

    it('should track duration in logs', async () => {
      mockQueryBus.execute.mockResolvedValue(mockQueryResult);

      await controller.search(mockSearchDto, mockUser);

      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'search_customers_complete',
          duration: expect.any(Number),
        }),
        'Customer search completed',
      );
    });
  });

  describe('getStats', () => {
    const mockStatsResult = {
      totalCustomers: 100,
      anonymousCount: 60,
      registeredCount: 40,
      newThisWeek: 5,
      newThisMonth: 20,
      topCustomers: [
        {
          id: 'customer-1',
          name: 'John Doe',
          appointmentCount: 15,
        },
        {
          id: 'customer-2',
          name: null,
          appointmentCount: 10,
        },
      ],
    };

    it('should get customer stats successfully', async () => {
      mockQueryBus.execute.mockResolvedValue(mockStatsResult);

      const result = await controller.getStats(mockUser);

      expect(result).toEqual({
        totalCustomers: 100,
        anonymousCount: 60,
        registeredCount: 40,
        newThisWeek: 5,
        newThisMonth: 20,
        topCustomers: [
          {
            id: 'customer-1',
            name: 'John Doe',
            appointmentCount: 15,
          },
          {
            id: 'customer-2',
            name: 'Unknown',
            appointmentCount: 10,
          },
        ],
      });

      expect(queryBus.execute).toHaveBeenCalledWith(expect.any(GetCustomerStatsQuery));

      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'get_customer_stats_start',
        }),
        'Starting customer stats retrieval',
      );

      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'get_customer_stats_complete',
          totalCustomers: 100,
        }),
        'Customer stats retrieved successfully',
      );
    });

    it('should throw ForbiddenException when user has no businessId', async () => {
      const userWithoutBusiness: UserPayload = {
        userId: 'user-123',
        businessId: undefined as any,
        email: 'test@example.com',
      };

      await expect(controller.getStats(userWithoutBusiness)).rejects.toThrow(ForbiddenException);

      expect(logger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'get_customer_stats_forbidden',
          reason: 'no_business_id',
        }),
        'User does not have a business',
      );

      expect(queryBus.execute).not.toHaveBeenCalled();
    });

    it('should replace null customer names with "Unknown"', async () => {
      mockQueryBus.execute.mockResolvedValue(mockStatsResult);

      const result = await controller.getStats(mockUser);

      const customerWithNullName = result.topCustomers.find((c) => c.id === 'customer-2');
      expect(customerWithNullName?.name).toBe('Unknown');
    });

    it('should log error and rethrow when query fails', async () => {
      const error = new Error('Database connection failed');
      mockQueryBus.execute.mockRejectedValue(error);

      await expect(controller.getStats(mockUser)).rejects.toThrow(error);

      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'get_customer_stats_error',
          error: 'Database connection failed',
        }),
        'Customer stats retrieval failed',
      );
    });

    it('should track duration in logs', async () => {
      mockQueryBus.execute.mockResolvedValue(mockStatsResult);

      await controller.getStats(mockUser);

      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'get_customer_stats_complete',
          duration: expect.any(Number),
        }),
        'Customer stats retrieved successfully',
      );
    });
  });
});

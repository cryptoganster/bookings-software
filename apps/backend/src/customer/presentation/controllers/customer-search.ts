import { Controller, Get, Query, UseGuards, ForbiddenException } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PinoLogger } from 'nestjs-pino';
import { JwtAuthGuard } from '@auth/infra/guards/jwt-auth';
import { CurrentUser, UserPayload } from '@auth/presentation/decorators/current-user';

import {
  SearchCustomersDto,
  SearchCustomersResponseDto,
  CustomerStatsResponseDto,
} from '@customer/presentation/dtos';

import {
  SearchCustomersQuery,
  SearchCustomersFilters,
} from '@customer/app/queries/search-customers/query';
import { GetCustomerStatsQuery } from '@customer/app/queries/get-customer-stats/query';

/**
 * CustomerSearchController
 *
 * Handles customer search and statistics endpoints
 *
 * Endpoints:
 * - GET /api/customers/search - Search customers with filters and pagination
 * - GET /api/customers/stats - Get customer statistics
 *
 * Authentication: All endpoints require valid JWT token
 * Authorization: Business-level isolation
 */
@ApiTags('customers')
@ApiBearerAuth()
@Controller('customers')
@UseGuards(JwtAuthGuard)
export class CustomerSearchController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(CustomerSearchController.name);
  }

  /**
   * Search customers with filters
   *
   * GET /api/customers/search
   *
   * Query params:
   * - searchText: string (optional) - Search by name or phone
   * - type: 'anonymous' | 'registered' (optional) - Filter by customer type
   * - page: number (optional, default: 1) - Page number
   * - limit: number (optional, default: 10) - Items per page
   * - sortBy: 'name' | 'createdAt' | 'appointmentCount' (optional, default: 'createdAt')
   * - sortOrder: 'asc' | 'desc' (optional, default: 'desc')
   *
   * Returns: Paginated list of customers
   *
   * Requirements: 1.1, 1.2, 1.5
   */
  @Get('search')
  @ApiOperation({
    summary: 'Search customers',
    description:
      'Search and filter customers with pagination. Supports text search, type filtering, and sorting.',
  })
  @ApiQuery({ name: 'searchText', required: false, description: 'Search by name or phone number' })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['anonymous', 'registered'],
    description: 'Filter by customer type',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (min: 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (min: 1, max: 100)',
    example: 10,
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: ['name', 'createdAt', 'appointmentCount'],
    description: 'Sort field',
    example: 'createdAt',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['asc', 'desc'],
    description: 'Sort order',
    example: 'desc',
  })
  @ApiResponse({
    status: 200,
    description: 'Customers found successfully',
    type: SearchCustomersResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiResponse({ status: 403, description: 'Forbidden - User does not have a business' })
  async search(
    @Query() dto: SearchCustomersDto,
    @CurrentUser() user: UserPayload,
  ): Promise<SearchCustomersResponseDto> {
    const startTime = Date.now();

    this.logger.info(
      {
        action: 'search_customers_start',
        userId: user.userId,
        businessId: user.businessId,
        filters: {
          searchText: dto.searchText,
          type: dto.type,
          page: dto.page,
          limit: dto.limit,
          sortBy: dto.sortBy,
          sortOrder: dto.sortOrder,
        },
      },
      'Starting customer search',
    );

    try {
      // Extract businessId from authenticated user
      const businessId = user.businessId;

      if (!businessId) {
        this.logger.warn(
          {
            action: 'search_customers_forbidden',
            userId: user.userId,
            reason: 'no_business_id',
          },
          'User does not have a business',
        );
        throw new ForbiddenException('User does not have a business');
      }

      // Build filters from DTO
      const filters: SearchCustomersFilters = {
        businessId,
        searchText: dto.searchText,
        type: dto.type || 'all',
        page: dto.page || 1,
        limit: dto.limit || 10,
        sortBy: dto.sortBy as 'name' | 'createdAt' | 'appointmentCount',
        sortOrder: dto.sortOrder === 'asc' ? 'ASC' : 'DESC',
      };

      // Dispatch query
      const result = await this.queryBus.execute(new SearchCustomersQuery(filters));

      const duration = Date.now() - startTime;

      this.logger.info(
        {
          action: 'search_customers_complete',
          userId: user.userId,
          businessId: user.businessId,
          resultCount: result.total,
          page: result.page,
          totalPages: result.totalPages,
          duration,
        },
        'Customer search completed',
      );

      // Transform to response DTO
      return {
        customers: result.customers.map((c: any) => ({
          id: c.id,
          businessId: c.businessId,
          userId: c.userId,
          whatsappPhone: c.whatsappPhone,
          name: c.name,
          appointmentCount: c.appointmentCount,
          createdAt: c.createdAt.toISOString(),
        })),
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
        hasNextPage: result.page < result.totalPages,
        hasPreviousPage: result.page > 1,
      };
    } catch (error: unknown) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        {
          action: 'search_customers_error',
          userId: user.userId,
          businessId: user.businessId,
          error: errorMessage,
          stack: errorStack,
          duration,
        },
        'Customer search failed',
      );

      throw error;
    }
  }

  /**
   * Get customer statistics
   *
   * GET /api/customers/stats
   *
   * Returns: Customer statistics for the business
   * - Total customers
   * - Anonymous vs registered counts
   * - New customers this week/month
   * - Top customers by appointment count
   *
   * Requirements: 1.1, 1.2, 1.5
   */
  @Get('stats')
  @ApiOperation({
    summary: 'Get customer statistics',
    description:
      'Get aggregated statistics for business customers including counts, new customers, and top customers.',
  })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
    type: CustomerStatsResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiResponse({ status: 403, description: 'Forbidden - User does not have a business' })
  async getStats(@CurrentUser() user: UserPayload): Promise<CustomerStatsResponseDto> {
    const startTime = Date.now();

    this.logger.info(
      {
        action: 'get_customer_stats_start',
        userId: user.userId,
        businessId: user.businessId,
      },
      'Starting customer stats retrieval',
    );

    try {
      const businessId = user.businessId;

      if (!businessId) {
        this.logger.warn(
          {
            action: 'get_customer_stats_forbidden',
            userId: user.userId,
            reason: 'no_business_id',
          },
          'User does not have a business',
        );
        throw new ForbiddenException('User does not have a business');
      }

      // Dispatch query
      const stats = await this.queryBus.execute(new GetCustomerStatsQuery(businessId));

      const duration = Date.now() - startTime;

      this.logger.info(
        {
          action: 'get_customer_stats_complete',
          userId: user.userId,
          businessId: user.businessId,
          totalCustomers: stats.totalCustomers,
          anonymousCount: stats.anonymousCount,
          registeredCount: stats.registeredCount,
          duration,
        },
        'Customer stats retrieved successfully',
      );

      // Return stats (already in correct format)
      return {
        totalCustomers: stats.totalCustomers,
        anonymousCount: stats.anonymousCount,
        registeredCount: stats.registeredCount,
        newThisWeek: stats.newThisWeek,
        newThisMonth: stats.newThisMonth,
        topCustomers: stats.topCustomers.map((c: any) => ({
          id: c.id,
          name: c.name || 'Unknown',
          appointmentCount: c.appointmentCount,
        })),
      };
    } catch (error: unknown) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        {
          action: 'get_customer_stats_error',
          userId: user.userId,
          businessId: user.businessId,
          error: errorMessage,
          stack: errorStack,
          duration,
        },
        'Customer stats retrieval failed',
      );

      throw error;
    }
  }
}

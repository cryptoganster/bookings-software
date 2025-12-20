import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
  ParseUUIDPipe,
  ForbiddenException,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { JwtAuthGuard } from '@auth/infra/guards/jwt-auth';
import { CurrentUser, UserPayload } from '@auth/presentation/decorators/current-user';
import { CustomerReadModel } from '@packages/shared-types';

import {
  SearchCustomersDto,
  DetectDuplicatesDto,
  SearchCustomersResponseDto,
  CustomerStatsResponseDto,
  DuplicatePairsResponseDto,
} from '@customer/presentation/dtos';

import {
  SearchCustomersQuery,
  SearchCustomersFilters,
} from '@customer/app/queries/search-customers/query';
import { GetCustomerStatsQuery } from '@customer/app/queries/get-customer-stats/query';
import { GetCustomerQuery } from '@customer/app/queries/get-customer/query';
import { DetectDuplicateCustomersQuery } from '@customer/app/queries/detect-duplicate-customers/query';
import { GetCustomersByUserIdQuery } from '@customer/app/queries/get-customers-by-user-id/query';
import {
  ExportCustomerDataQuery,
  CustomerDataExport,
} from '@customer/app/queries/export-customer-data/query';

/**
 * CustomerController
 *
 * REST API endpoints for Customer BC
 * Connects frontend to CQRS handlers (commands/queries)
 *
 * Authentication: All endpoints require valid JWT token
 * Authorization: Business-level isolation (users can only access their business customers)
 */
@Controller('customers')
@UseGuards(JwtAuthGuard)
export class CustomerController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

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
   * Requirements: 1
   */
  @Get('search')
  async search(
    @Query() dto: SearchCustomersDto,
    @CurrentUser() user: UserPayload,
  ): Promise<SearchCustomersResponseDto> {
    // Extract businessId from authenticated user
    const businessId = user.businessId;

    if (!businessId) {
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

    // Transform to response DTO
    // Note: result.customers already has appointmentCount from the query
    return {
      customers: result.customers.map((c) => ({
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
    };
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
   * Requirements: 2
   */
  @Get('stats')
  async getStats(@CurrentUser() user: UserPayload): Promise<CustomerStatsResponseDto> {
    const businessId = user.businessId;

    if (!businessId) {
      throw new ForbiddenException('User does not have a business');
    }

    // Dispatch query
    const stats = await this.queryBus.execute(new GetCustomerStatsQuery(businessId));

    // Return stats (already in correct format)
    return {
      totalCustomers: stats.totalCustomers,
      anonymousCount: stats.anonymousCount,
      registeredCount: stats.registeredCount,
      newThisWeek: stats.newThisWeek,
      newThisMonth: stats.newThisMonth,
      topCustomers: stats.topCustomers.map((c) => ({
        id: c.id,
        name: c.name || 'Unknown',
        appointmentCount: c.appointmentCount,
      })),
    };
  }

  /**
   * Get customer by ID
   *
   * GET /api/customers/:id
   *
   * Params:
   * - id: string (UUID) - Customer ID
   *
   * Returns: Customer details
   *
   * Throws:
   * - 404 if customer not found
   * - 403 if customer belongs to different business
   *
   * Requirements: 3
   */
  @Get(':id')
  async getById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: UserPayload,
  ): Promise<CustomerReadModel> {
    // Dispatch query
    const customer = await this.queryBus.execute(new GetCustomerQuery(id));

    // Validate business ownership
    if (customer.businessId !== user.businessId) {
      throw new ForbiddenException('Access denied');
    }

    // Return customer (transform to API format)
    return {
      id: customer.id,
      businessId: customer.businessId,
      userId: customer.userId,
      whatsappPhone: customer.whatsappPhone,
      name: customer.name,
      createdAt: customer.createdAt.toISOString(),
    };
  }

  /**
   * Detect duplicate customers
   *
   * GET /api/customers/duplicates
   *
   * Query params:
   * - threshold: number (optional, default: 0.8) - Similarity threshold (0-1)
   *
   * Returns: List of potential duplicate pairs with similarity scores
   *
   * Requirements: 4
   */
  @Get('duplicates')
  async getDuplicates(
    @Query() dto: DetectDuplicatesDto,
    @CurrentUser() user: UserPayload,
  ): Promise<DuplicatePairsResponseDto> {
    const businessId = user.businessId;

    if (!businessId) {
      throw new ForbiddenException('User does not have a business');
    }

    // Dispatch query
    const pairs = await this.queryBus.execute(
      new DetectDuplicateCustomersQuery(businessId, dto.threshold || 0.8),
    );

    // Transform to response DTO
    return {
      pairs: pairs.map((pair) => ({
        customer1: {
          id: pair.customer1.id,
          businessId: pair.customer1.businessId,
          userId: pair.customer1.userId,
          whatsappPhone: pair.customer1.whatsappPhone,
          name: pair.customer1.name,
          createdAt: pair.customer1.createdAt.toISOString(),
        },
        customer2: {
          id: pair.customer2.id,
          businessId: pair.customer2.businessId,
          userId: pair.customer2.userId,
          whatsappPhone: pair.customer2.whatsappPhone,
          name: pair.customer2.name,
          createdAt: pair.customer2.createdAt.toISOString(),
        },
        similarityScore: pair.similarityScore,
        reasons: pair.reasons,
      })),
    };
  }

  /**
   * Get customers by user ID
   *
   * GET /api/customers/by-user/:userId
   *
   * Params:
   * - userId: string (UUID) - User ID
   *
   * Returns: List of customers linked to the user
   *
   * Throws:
   * - 403 if requesting different user's customers (non-admin)
   *
   * Requirements: 8
   */
  @Get('by-user/:userId')
  async getByUserId(
    @Param('userId', ParseUUIDPipe) userId: string,
    @CurrentUser() user: UserPayload,
  ): Promise<CustomerReadModel[]> {
    // Validate user can access this data
    // Only allow users to access their own customers (or admins in future)
    if (userId !== user.userId) {
      throw new ForbiddenException('Access denied');
    }

    // Dispatch query
    const customers = await this.queryBus.execute(new GetCustomersByUserIdQuery(userId));

    // Transform to response
    return customers.map((c) => ({
      id: c.id,
      businessId: c.businessId,
      userId: c.userId,
      whatsappPhone: c.whatsappPhone,
      name: c.name,
      createdAt: c.createdAt.toISOString(),
    }));
  }

  /**
   * Export customer data (GDPR compliance)
   *
   * GET /api/customers/:id/export
   *
   * Params:
   * - id: string (UUID) - Customer ID
   *
   * Returns: Complete customer data export including:
   * - Customer information
   * - All appointments
   * - All conversations
   *
   * Throws:
   * - 404 if customer not found
   * - 403 if customer belongs to different business
   *
   * Requirements: 7
   */
  @Get(':id/export')
  async exportData(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: UserPayload,
  ): Promise<CustomerDataExport> {
    // First get customer to validate business ownership
    const customer = await this.queryBus.execute(new GetCustomerQuery(id));

    // Validate business ownership
    if (customer.businessId !== user.businessId) {
      throw new ForbiddenException('Access denied');
    }

    // Dispatch export query
    const exportData = await this.queryBus.execute(new ExportCustomerDataQuery(id));

    // Return export data (already in correct format)
    return exportData;
  }

  // Command endpoints will be implemented in Phase 3
}

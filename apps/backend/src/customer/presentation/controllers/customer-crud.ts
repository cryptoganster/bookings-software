import {
  Controller,
  Get,
  Delete,
  Param,
  UseGuards,
  ParseUUIDPipe,
  ForbiddenException,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { PinoLogger } from 'nestjs-pino';
import { JwtAuthGuard } from '@auth/infra/guards/jwt-auth';
import { CurrentUser, UserPayload } from '@auth/presentation/decorators/current-user';
import { CustomerReadModel } from '@packages/shared-types';

import { MessageResponseDto } from '@customer/presentation/dtos';

import { GetCustomerQuery } from '@customer/app/queries/get-customer/query';
import { GetCustomersByUserIdQuery } from '@customer/app/queries/get-customers-by-user-id/query';
import {
  ExportCustomerDataQuery,
  CustomerDataExport,
} from '@customer/app/queries/export-customer-data/query';
import { DeleteCustomerCommand } from '@customer/app/commands/delete-customer/command';

/**
 * CustomerCrudController
 *
 * Handles CRUD operations for customers
 *
 * Endpoints:
 * - GET /api/customers/:id - Get customer by ID
 * - GET /api/customers/by-user/:userId - Get customers by user ID
 * - GET /api/customers/:id/export - Export customer data (GDPR)
 * - DELETE /api/customers/:id - Delete customer (GDPR)
 *
 * Authentication: All endpoints require valid JWT token
 * Authorization: Business-level isolation (users can only access their business customers)
 */
@ApiTags('customers')
@ApiBearerAuth()
@Controller('customers')
@UseGuards(JwtAuthGuard)
export class CustomerCrudController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(CustomerCrudController.name);
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
  @ApiOperation({
    summary: 'Get customer by ID',
    description: 'Retrieve detailed information for a specific customer.',
  })
  @ApiParam({ name: 'id', description: 'Customer ID (UUID)', type: String })
  @ApiResponse({ status: 200, description: 'Customer found successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid UUID format' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Customer belongs to different business' })
  @ApiResponse({ status: 404, description: 'Not Found - Customer not found' })
  async getById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: UserPayload,
  ): Promise<CustomerReadModel> {
    const startTime = Date.now();

    this.logger.info(
      {
        action: 'get_customer_by_id_start',
        userId: user.userId,
        businessId: user.businessId,
        customerId: id,
      },
      'Starting customer retrieval by ID',
    );

    try {
      // Dispatch query
      const customer = await this.queryBus.execute(new GetCustomerQuery(id));

      // Validate business ownership
      if (customer.businessId !== user.businessId) {
        this.logger.warn(
          {
            action: 'get_customer_by_id_forbidden',
            userId: user.userId,
            businessId: user.businessId,
            customerId: id,
            customerBusinessId: customer.businessId,
            reason: 'different_business',
          },
          'Access denied - customer belongs to different business',
        );
        throw new ForbiddenException('Access denied');
      }

      const duration = Date.now() - startTime;

      this.logger.info(
        {
          action: 'get_customer_by_id_complete',
          userId: user.userId,
          businessId: user.businessId,
          customerId: id,
          duration,
        },
        'Customer retrieved successfully',
      );

      // Return customer (transform to API format)
      return {
        id: customer.id,
        businessId: customer.businessId,
        userId: customer.userId,
        whatsappPhone: customer.whatsappPhone,
        name: customer.name,
        createdAt: customer.createdAt.toISOString(),
      };
    } catch (error: unknown) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        {
          action: 'get_customer_by_id_error',
          userId: user.userId,
          businessId: user.businessId,
          customerId: id,
          error: errorMessage,
          stack: errorStack,
          duration,
        },
        'Customer retrieval failed',
      );

      throw error;
    }
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
  @ApiOperation({
    summary: 'Get customers by user ID',
    description: 'Get all customers linked to a specific user (registered customers only).',
  })
  @ApiParam({ name: 'userId', description: 'User ID (UUID)', type: String })
  @ApiResponse({ status: 200, description: 'Customers found successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid UUID format' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Cannot access other users customers' })
  async getByUserId(
    @Param('userId', ParseUUIDPipe) userId: string,
    @CurrentUser() user: UserPayload,
  ): Promise<CustomerReadModel[]> {
    const startTime = Date.now();

    this.logger.info(
      {
        action: 'get_customers_by_user_id_start',
        userId: user.userId,
        targetUserId: userId,
      },
      'Starting customer retrieval by user ID',
    );

    try {
      // Validate user can access this data
      // Only allow users to access their own customers (or admins in future)
      if (userId !== user.userId) {
        this.logger.warn(
          {
            action: 'get_customers_by_user_id_forbidden',
            userId: user.userId,
            targetUserId: userId,
            reason: 'different_user',
          },
          'Access denied - cannot access other users customers',
        );
        throw new ForbiddenException('Access denied');
      }

      // Dispatch query
      const customers = await this.queryBus.execute(new GetCustomersByUserIdQuery(userId));

      const duration = Date.now() - startTime;

      this.logger.info(
        {
          action: 'get_customers_by_user_id_complete',
          userId: user.userId,
          targetUserId: userId,
          customersFound: customers.length,
          duration,
        },
        'Customers retrieved successfully by user ID',
      );

      // Transform to response
      return customers.map((c) => ({
        id: c.id,
        businessId: c.businessId,
        userId: c.userId,
        whatsappPhone: c.whatsappPhone,
        name: c.name,
        createdAt: c.createdAt.toISOString(),
      }));
    } catch (error: unknown) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        {
          action: 'get_customers_by_user_id_error',
          userId: user.userId,
          targetUserId: userId,
          error: errorMessage,
          stack: errorStack,
          duration,
        },
        'Customer retrieval by user ID failed',
      );

      throw error;
    }
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
  @ApiOperation({
    summary: 'Export customer data (GDPR)',
    description:
      'Export complete customer data including appointments and conversations for GDPR compliance.',
  })
  @ApiParam({ name: 'id', description: 'Customer ID (UUID)', type: String })
  @ApiResponse({ status: 200, description: 'Data exported successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid UUID format' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Customer belongs to different business' })
  @ApiResponse({ status: 404, description: 'Not Found - Customer not found' })
  async exportData(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: UserPayload,
  ): Promise<CustomerDataExport> {
    const startTime = Date.now();

    this.logger.info(
      {
        action: 'export_customer_data_start',
        userId: user.userId,
        businessId: user.businessId,
        customerId: id,
      },
      'Starting customer data export (GDPR)',
    );

    try {
      // First get customer to validate business ownership
      const customer = await this.queryBus.execute(new GetCustomerQuery(id));

      // Validate business ownership
      if (customer.businessId !== user.businessId) {
        this.logger.warn(
          {
            action: 'export_customer_data_forbidden',
            userId: user.userId,
            businessId: user.businessId,
            customerId: id,
            customerBusinessId: customer.businessId,
            reason: 'different_business',
          },
          'Access denied - customer belongs to different business',
        );
        throw new ForbiddenException('Access denied');
      }

      // Dispatch export query
      const exportData = await this.queryBus.execute(new ExportCustomerDataQuery(id));

      const duration = Date.now() - startTime;

      this.logger.info(
        {
          action: 'export_customer_data_complete',
          userId: user.userId,
          businessId: user.businessId,
          customerId: id,
          appointmentsCount: exportData.appointments?.length || 0,
          conversationsCount: exportData.conversations?.length || 0,
          duration,
        },
        'Customer data exported successfully',
      );

      // Return export data (already in correct format)
      return exportData;
    } catch (error: unknown) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        {
          action: 'export_customer_data_error',
          userId: user.userId,
          businessId: user.businessId,
          customerId: id,
          error: errorMessage,
          stack: errorStack,
          duration,
        },
        'Customer data export failed',
      );

      throw error;
    }
  }

  /**
   * Delete customer (GDPR compliance)
   *
   * DELETE /api/customers/:id
   *
   * Params:
   * - id: string (UUID) - Customer ID
   *
   * Returns: Success message
   *
   * Throws:
   * - 400 if customer has future appointments
   * - 403 if customer belongs to different business
   * - 404 if customer not found
   *
   * Business Rules:
   * - Customer data is anonymized (not physically deleted)
   * - Name set to null
   * - Phone set to +999{timestamp}
   * - Cannot delete if customer has future appointments
   * - Preserves referential integrity
   *
   * Requirements: 6
   */
  @Delete(':id')
  @ApiOperation({
    summary: 'Delete customer (GDPR)',
    description:
      'Anonymize customer data for GDPR compliance. Customer is soft-deleted (data anonymized, not physically removed).',
  })
  @ApiParam({ name: 'id', description: 'Customer ID (UUID)', type: String })
  @ApiResponse({
    status: 200,
    description: 'Customer deleted successfully',
    type: MessageResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Customer has future appointments' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Customer belongs to different business' })
  @ApiResponse({ status: 404, description: 'Not Found - Customer not found' })
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: UserPayload,
  ): Promise<MessageResponseDto> {
    const startTime = Date.now();

    this.logger.info(
      {
        action: 'delete_customer_start',
        userId: user.userId,
        businessId: user.businessId,
        customerId: id,
      },
      'Starting customer deletion (GDPR anonymization)',
    );

    try {
      // First get customer to validate business ownership
      const customer = await this.queryBus.execute(new GetCustomerQuery(id));

      // Validate business ownership
      if (customer.businessId !== user.businessId) {
        this.logger.warn(
          {
            action: 'delete_customer_forbidden',
            userId: user.userId,
            businessId: user.businessId,
            customerId: id,
            customerBusinessId: customer.businessId,
            reason: 'different_business',
          },
          'Access denied - customer belongs to different business',
        );
        throw new ForbiddenException('Access denied');
      }

      // Extract userId for audit trail
      const userId = user.userId;

      // Dispatch command
      await this.commandBus.execute(new DeleteCustomerCommand(id, userId));

      const duration = Date.now() - startTime;

      this.logger.info(
        {
          action: 'delete_customer_complete',
          userId: user.userId,
          businessId: user.businessId,
          customerId: id,
          duration,
        },
        'Customer deleted (anonymized) successfully',
      );

      // Return success message
      return {
        message: 'Customer deleted successfully',
      };
    } catch (error: unknown) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        {
          action: 'delete_customer_error',
          userId: user.userId,
          businessId: user.businessId,
          customerId: id,
          error: errorMessage,
          stack: errorStack,
          duration,
        },
        'Customer deletion failed',
      );

      throw error;
    }
  }
}

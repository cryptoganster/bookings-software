import { Controller, Post, Body, UseGuards, HttpCode } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { PinoLogger } from 'nestjs-pino';
import { JwtAuthGuard } from '@auth/infra/guards/jwt-auth';
import { CurrentUser, UserPayload } from '@auth/presentation/decorators/current-user';

import { MergeCustomersDto, MessageResponseDto } from '@customer/presentation/dtos';

import { MergeCustomersCommand } from '@customer/app/commands/merge-customers/command';

/**
 * CustomerMergeController
 *
 * Handles customer merge operations
 *
 * Endpoints:
 * - POST /api/customers/merge - Merge two customer records
 *
 * Authentication: All endpoints require valid JWT token
 * Authorization: Business-level isolation (both customers must belong to same business)
 */
@ApiTags('customers')
@ApiBearerAuth()
@Controller('customers')
@UseGuards(JwtAuthGuard)
export class CustomerMergeController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(CustomerMergeController.name);
  }

  /**
   * Merge two customers
   *
   * POST /api/customers/merge
   *
   * Body:
   * - sourceCustomerId: string (UUID) - Customer to be merged (will be marked as merged)
   * - targetCustomerId: string (UUID) - Customer to merge into (will receive all data)
   *
   * Returns: Success message
   *
   * Throws:
   * - 400 if source and target are the same customer
   * - 400 if customers belong to different businesses
   * - 404 if either customer not found
   *
   * Business Rules:
   * - Both customers must belong to the same business
   * - Source customer is soft-deleted (marked as merged)
   * - All appointments transferred to target
   * - All conversations transferred to target
   * - Operation is atomic (transaction)
   *
   * Requirements: 5
   */
  @Post('merge')
  @HttpCode(200) // Explicitly set status code to 200 instead of default 201
  @ApiOperation({
    summary: 'Merge customers',
    description:
      'Merge two customer records. Source customer is marked as merged and all data is transferred to target.',
  })
  @ApiBody({ type: MergeCustomersDto })
  @ApiResponse({
    status: 200,
    description: 'Customers merged successfully',
    type: MessageResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid UUIDs, same customer, or different business',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiResponse({ status: 404, description: 'Not Found - One or both customers not found' })
  async merge(
    @Body() dto: MergeCustomersDto,
    @CurrentUser() user: UserPayload,
  ): Promise<MessageResponseDto> {
    const startTime = Date.now();

    this.logger.info(
      {
        action: 'merge_customers_start',
        userId: user.userId,
        sourceCustomerId: dto.sourceCustomerId,
        targetCustomerId: dto.targetCustomerId,
      },
      'Starting customer merge',
    );

    try {
      // Extract userId for audit trail
      const userId = user.userId;

      // Dispatch command
      await this.commandBus.execute(
        new MergeCustomersCommand(dto.sourceCustomerId, dto.targetCustomerId, userId),
      );

      const duration = Date.now() - startTime;

      this.logger.info(
        {
          action: 'merge_customers_complete',
          userId: user.userId,
          sourceCustomerId: dto.sourceCustomerId,
          targetCustomerId: dto.targetCustomerId,
          duration,
        },
        'Customers merged successfully',
      );

      // Return success message
      return {
        message: 'Customers merged successfully',
      };
    } catch (error: unknown) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        {
          action: 'merge_customers_error',
          userId: user.userId,
          sourceCustomerId: dto.sourceCustomerId,
          targetCustomerId: dto.targetCustomerId,
          error: errorMessage,
          stack: errorStack,
          duration,
        },
        'Customer merge failed',
      );

      throw error;
    }
  }
}

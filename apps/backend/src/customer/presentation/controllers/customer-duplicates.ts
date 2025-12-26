import { Controller, Get, Query, UseGuards, ForbiddenException } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PinoLogger } from 'nestjs-pino';
import { JwtAuthGuard } from '@auth/infra/guards/jwt-auth';
import { CurrentUser, UserPayload } from '@auth/presentation/decorators/current-user';

import { DetectDuplicatesDto, DuplicatePairsResponseDto } from '@customer/presentation/dtos';

import { DetectDuplicateCustomersQuery } from '@customer/app/queries/detect-duplicate-customers/query';

/**
 * CustomerDuplicatesController
 *
 * Handles duplicate detection operations for customers
 *
 * Endpoints:
 * - GET /api/customers/duplicates - Detect potential duplicate customers
 *
 * Authentication: All endpoints require valid JWT token
 * Authorization: Business-level isolation (users can only access their business customers)
 */
@ApiTags('customers')
@ApiBearerAuth()
@Controller('customers')
@UseGuards(JwtAuthGuard)
export class CustomerDuplicatesController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(CustomerDuplicatesController.name);
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
  @ApiOperation({
    summary: 'Detect duplicate customers',
    description:
      'Find potential duplicate customers based on name similarity. Returns pairs with similarity scores.',
  })
  @ApiQuery({
    name: 'threshold',
    required: false,
    type: Number,
    description: 'Similarity threshold (0-1)',
    example: 0.8,
  })
  @ApiResponse({
    status: 200,
    description: 'Duplicates detected successfully',
    type: DuplicatePairsResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiResponse({ status: 403, description: 'Forbidden - User does not have a business' })
  async getDuplicates(
    @Query() dto: DetectDuplicatesDto,
    @CurrentUser() user: UserPayload,
  ): Promise<DuplicatePairsResponseDto> {
    const startTime = Date.now();

    this.logger.info(
      {
        action: 'detect_duplicates_start',
        userId: user.userId,
        businessId: user.businessId,
        threshold: dto.threshold || 0.8,
      },
      'Starting duplicate detection',
    );

    try {
      const businessId = user.businessId;

      if (!businessId) {
        this.logger.warn(
          {
            action: 'detect_duplicates_forbidden',
            userId: user.userId,
            reason: 'no_business_id',
          },
          'User does not have a business',
        );
        throw new ForbiddenException('User does not have a business');
      }

      // Dispatch query
      const pairs = await this.queryBus.execute(
        new DetectDuplicateCustomersQuery(businessId, dto.threshold || 0.8),
      );

      const duration = Date.now() - startTime;

      this.logger.info(
        {
          action: 'detect_duplicates_complete',
          userId: user.userId,
          businessId: user.businessId,
          pairsFound: pairs.length,
          threshold: dto.threshold || 0.8,
          duration,
        },
        'Duplicate detection completed',
      );

      // Transform to response DTO
      return {
        pairs: pairs.map((pair: any) => ({
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
    } catch (error: unknown) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        {
          action: 'detect_duplicates_error',
          userId: user.userId,
          businessId: user.businessId,
          error: errorMessage,
          stack: errorStack,
          duration,
        },
        'Duplicate detection failed',
      );

      throw error;
    }
  }
}

import { ApiProperty } from '@nestjs/swagger';
import { CustomerReadModel } from '@packages/shared-types';

/**
 * Generic message response
 *
 * Used by endpoints that return a simple success message
 */
export class MessageResponseDto {
  @ApiProperty({
    description: 'Success message',
    example: 'Operation completed successfully',
  })
  message!: string;
}

/**
 * Search customers response with pagination
 *
 * Used by: GET /api/customers/search
 */
export class SearchCustomersResponseDto {
  @ApiProperty({
    type: [Object],
    description: 'List of customers matching the search criteria',
  })
  customers!: CustomerReadModel[];

  @ApiProperty({
    description: 'Total number of customers matching the filters',
    example: 100,
  })
  total!: number;

  @ApiProperty({
    description: 'Current page number (1-based)',
    example: 1,
  })
  page!: number;

  @ApiProperty({
    description: 'Number of items per page',
    example: 10,
  })
  limit!: number;

  @ApiProperty({
    description: 'Total number of pages',
    example: 10,
  })
  totalPages!: number;
}

/**
 * Top customer DTO for statistics
 */
class TopCustomerDto {
  @ApiProperty({
    description: 'Customer ID',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id!: string;

  @ApiProperty({
    description: 'Customer name',
    example: 'John Doe',
  })
  name!: string;

  @ApiProperty({
    description: 'Total appointment count',
    example: 15,
  })
  appointmentCount!: number;
}

/**
 * Customer statistics response
 *
 * Used by: GET /api/customers/stats
 */
export class CustomerStatsResponseDto {
  @ApiProperty({
    description: 'Total number of customers',
    example: 150,
  })
  totalCustomers!: number;

  @ApiProperty({
    description: 'Number of anonymous customers (not linked to user)',
    example: 100,
  })
  anonymousCount!: number;

  @ApiProperty({
    description: 'Number of registered customers (linked to user)',
    example: 50,
  })
  registeredCount!: number;

  @ApiProperty({
    description: 'New customers this week',
    example: 10,
  })
  newThisWeek!: number;

  @ApiProperty({
    description: 'New customers this month',
    example: 25,
  })
  newThisMonth!: number;

  @ApiProperty({
    type: [TopCustomerDto],
    description: 'Top customers by appointment count',
  })
  topCustomers!: TopCustomerDto[];
}

/**
 * Duplicate pair DTO
 */
class DuplicatePairDto {
  @ApiProperty({
    type: Object,
    description: 'First customer in the potential duplicate pair',
  })
  customer1!: CustomerReadModel;

  @ApiProperty({
    type: Object,
    description: 'Second customer in the potential duplicate pair',
  })
  customer2!: CustomerReadModel;

  @ApiProperty({
    description: 'Similarity score (0-1). Higher = more similar',
    minimum: 0,
    maximum: 1,
    example: 0.85,
  })
  similarityScore!: number;

  @ApiProperty({
    type: [String],
    description: 'Reasons why these customers are considered duplicates',
    example: ['Similar names', 'Same phone number'],
  })
  reasons!: string[];
}

/**
 * Duplicate pairs response
 *
 * Used by: GET /api/customers/duplicates
 */
export class DuplicatePairsResponseDto {
  @ApiProperty({
    type: [DuplicatePairDto],
    description: 'List of potential duplicate customer pairs',
  })
  pairs!: DuplicatePairDto[];
}

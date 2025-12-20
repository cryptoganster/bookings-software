import { ApiProperty } from '@nestjs/swagger';
import { CustomerReadModel } from '@packages/shared-types';

export class SearchCustomersResponseDto {
  @ApiProperty({ type: [Object], description: 'List of customers' })
  customers!: CustomerReadModel[];

  @ApiProperty({ description: 'Total number of customers matching the filters' })
  total!: number;

  @ApiProperty({ description: 'Current page number' })
  page!: number;

  @ApiProperty({ description: 'Number of items per page' })
  limit!: number;

  @ApiProperty({ description: 'Total number of pages' })
  totalPages!: number;
}

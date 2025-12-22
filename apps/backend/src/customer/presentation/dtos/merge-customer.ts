import 'reflect-metadata';
import { IsUUID, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for merging two customer records
 *
 * Used by: POST /api/customers/merge
 *
 * The source customer will be merged into the target customer.
 * All appointments and data from source will be transferred to target.
 * The source customer will be deleted after merge.
 */
export class MergeCustomersDto {
  @ApiProperty({
    description: 'ID of the customer to merge FROM (will be deleted)',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  sourceCustomerId!: string;

  @ApiProperty({
    description: 'ID of the customer to merge INTO (will be kept)',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsUUID()
  @IsNotEmpty()
  targetCustomerId!: string;
}

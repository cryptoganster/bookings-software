import 'reflect-metadata';
import { IsOptional, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for detecting duplicate customers
 *
 * Used by: GET /api/customers/duplicates
 *
 * Uses similarity algorithm to find potential duplicate customer records
 * based on name and phone number matching.
 */
export class DetectDuplicatesDto {
  @ApiProperty({
    description: 'Similarity threshold (0-1). Higher values = stricter matching',
    minimum: 0,
    maximum: 1,
    default: 0.8,
    required: false,
    example: 0.8,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  @Type(() => Number)
  threshold?: number = 0.8;
}

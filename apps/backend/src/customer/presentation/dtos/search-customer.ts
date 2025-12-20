import 'reflect-metadata';
import { IsOptional, IsString, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for searching customers with filters and pagination
 *
 * Used by: GET /api/customers/search
 */
export class SearchCustomersDto {
  @ApiProperty({
    description: 'Search by name or phone number',
    required: false,
    example: 'John',
  })
  @IsOptional()
  @IsString()
  searchText?: string;

  @ApiProperty({
    description: 'Filter by customer type',
    enum: ['anonymous', 'registered'],
    required: false,
    example: 'registered',
  })
  @IsOptional()
  @IsEnum(['anonymous', 'registered'])
  type?: 'anonymous' | 'registered';

  @ApiProperty({
    description: 'Page number (1-based)',
    minimum: 1,
    default: 1,
    required: false,
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiProperty({
    description: 'Number of items per page',
    minimum: 1,
    maximum: 100,
    default: 10,
    required: false,
    example: 10,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 10;

  @ApiProperty({
    description: 'Field to sort by',
    enum: ['name', 'createdAt', 'appointmentCount'],
    default: 'createdAt',
    required: false,
    example: 'createdAt',
  })
  @IsOptional()
  @IsEnum(['name', 'createdAt', 'appointmentCount'])
  sortBy?: string = 'createdAt';

  @ApiProperty({
    description: 'Sort order',
    enum: ['asc', 'desc'],
    default: 'desc',
    required: false,
    example: 'desc',
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}

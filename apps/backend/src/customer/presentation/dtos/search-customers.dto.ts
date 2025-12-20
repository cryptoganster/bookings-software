import 'reflect-metadata';
import { IsOptional, IsString, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class SearchCustomersDto {
  @IsOptional()
  @IsString()
  searchText?: string;

  @IsOptional()
  @IsEnum(['anonymous', 'registered'])
  type?: 'anonymous' | 'registered';

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 10;

  @IsOptional()
  @IsEnum(['name', 'createdAt', 'appointmentCount'])
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}

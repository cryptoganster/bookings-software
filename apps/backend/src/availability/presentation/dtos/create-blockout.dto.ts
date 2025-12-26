import { IsUUID, IsDateString, IsString, IsOptional } from 'class-validator';

/**
 * DTO for creating a blockout
 */
export class CreateBlockoutDto {
  @IsUUID()
  businessId!: string;

  @IsDateString()
  startDate!: string; // ISO 8601 format

  @IsDateString()
  endDate!: string; // ISO 8601 format

  @IsOptional()
  @IsString()
  reason?: string;
}

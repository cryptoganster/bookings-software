import { IsUUID, IsDateString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for getting available time slots
 */
export class GetAvailableSlotsDto {
  @IsUUID()
  offeringId!: string;

  @IsUUID()
  businessId!: string;

  @IsDateString()
  date!: string; // ISO 8601 format (date only)

  @IsInt()
  @Type(() => Number)
  @Min(15)
  durationMinutes!: number;
}

import { IsUUID, IsDateString } from 'class-validator';

/**
 * DTO for getting available dates
 */
export class GetAvailableDatesDto {
  @IsUUID()
  offeringId!: string;

  @IsUUID()
  businessId!: string;

  @IsDateString()
  startDate!: string; // ISO 8601 format

  @IsDateString()
  endDate!: string; // ISO 8601 format
}

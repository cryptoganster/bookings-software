import { IsUUID, IsDateString } from 'class-validator';

/**
 * DTO for getting available time slots
 */
export class GetAvailableSlotsDto {
  @IsUUID()
  offeringId!: string;

  @IsDateString()
  date!: string; // ISO 8601 format (date only)
}

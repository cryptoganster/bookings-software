import { IsString, MinLength, IsOptional } from 'class-validator';

/**
 * DTO for updating a schedule
 */
export class UpdateScheduleDto {
  @IsOptional()
  @IsString()
  @MinLength(5)
  startTime?: string; // Format: "HH:MM" (e.g., "09:00")

  @IsOptional()
  @IsString()
  @MinLength(5)
  endTime?: string; // Format: "HH:MM" (e.g., "17:00")
}

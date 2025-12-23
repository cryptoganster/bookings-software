import { IsUUID, IsInt, Min, Max, IsString, MinLength } from 'class-validator';

/**
 * DTO for creating a schedule
 */
export class CreateScheduleDto {
  @IsUUID()
  businessId!: string;

  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek!: number; // 0 = Sunday, 6 = Saturday

  @IsString()
  @MinLength(5)
  startTime!: string; // Format: "HH:MM" (e.g., "09:00")

  @IsString()
  @MinLength(5)
  endTime!: string; // Format: "HH:MM" (e.g., "17:00")
}

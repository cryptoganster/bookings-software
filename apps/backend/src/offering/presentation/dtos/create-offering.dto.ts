import { IsString, IsInt, Min, Max, IsOptional, MinLength, MaxLength } from 'class-validator';

export class CreateOfferingDto {
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name!: string;

  @IsInt()
  @Min(15)
  @Max(480)
  duration!: number; // Changed from durationMinutes to match API contract

  @IsInt()
  @Min(1)
  @Max(100)
  maxCapacityPerSlot!: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxDailyCapacity?: number | null;
}

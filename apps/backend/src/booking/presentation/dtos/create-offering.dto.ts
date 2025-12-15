import { IsString, IsNotEmpty, IsNumber, IsOptional, Min, IsBoolean } from 'class-validator';

export class CreateOfferingDto {
  @IsString()
  @IsNotEmpty()
  readonly name!: string;

  @IsNumber()
  @Min(15, { message: 'duration must be at least 15 minutes' })
  readonly duration!: number;

  @IsNumber()
  @Min(1, { message: 'maxCapacityPerSlot must be at least 1' })
  readonly maxCapacityPerSlot!: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  readonly maxDailyCapacity?: number | null;

  @IsBoolean()
  @IsOptional()
  readonly isActive?: boolean;
}

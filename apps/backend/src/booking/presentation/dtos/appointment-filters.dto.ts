import { IsOptional, IsEnum, IsDateString, IsUUID } from 'class-validator';

export class AppointmentFiltersDto {
  @IsOptional()
  @IsEnum(['CONFIRMED', 'CANCELLED', 'COMPLETED'])
  status?: 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsUUID()
  offeringId?: string;

  @IsOptional()
  @IsUUID()
  customerId?: string;
}

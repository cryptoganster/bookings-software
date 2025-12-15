import { IsUUID, IsDate, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAppointmentDto {
  @IsUUID()
  @IsNotEmpty()
  readonly customerId!: string;

  @IsUUID()
  @IsNotEmpty()
  readonly offeringId!: string;

  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  readonly dateTime!: Date;
}

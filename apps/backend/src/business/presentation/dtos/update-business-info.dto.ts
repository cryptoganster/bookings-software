import { IsString, IsNotEmpty, MinLength, MaxLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { AddressDto } from '@business/presentation/dtos/create-business.dto';

/**
 * DTO for updating business information
 */
export class UpdateBusinessInfoDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(100)
  name!: string;

  @ValidateNested()
  @Type(() => AddressDto)
  address!: AddressDto;

  @IsString()
  @IsNotEmpty()
  timezone!: string;
}

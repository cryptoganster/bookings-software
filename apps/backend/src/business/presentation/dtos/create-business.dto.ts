import {
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  Matches,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Address DTO
 */
export class AddressDto {
  @IsString()
  @IsNotEmpty()
  street!: string;

  @IsString()
  @IsNotEmpty()
  city!: string;

  @IsString()
  @IsOptional()
  state?: string | null;

  @IsString()
  @IsNotEmpty()
  country!: string;

  @IsString()
  @IsOptional()
  postalCode?: string | null;
}

/**
 * DTO for creating a new business
 */
export class CreateBusinessDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(100)
  name!: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\+[1-9]\d{1,14}$/, {
    message: 'whatsappNumber must be in E.164 format (e.g., +18095551234)',
  })
  whatsappNumber!: string;

  @ValidateNested()
  @Type(() => AddressDto)
  address!: AddressDto;

  @IsString()
  @IsNotEmpty()
  timezone!: string;
}

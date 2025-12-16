import { IsString, IsOptional, IsNotEmpty, Matches } from 'class-validator';

export class UpdateBusinessDto {
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  readonly name?: string;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  @Matches(/^\+[1-9]\d{1,14}$/, {
    message: 'whatsappNumber must be a valid E.164 format phone number',
  })
  readonly whatsappNumber?: string;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  readonly address?: string;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  readonly timezone?: string;
}

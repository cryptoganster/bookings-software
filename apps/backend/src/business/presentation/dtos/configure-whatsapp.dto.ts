import { IsString, IsNotEmpty, Matches } from 'class-validator';

/**
 * DTO for configuring WhatsApp number
 */
export class ConfigureWhatsAppDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+[1-9]\d{1,14}$/, {
    message: 'whatsappNumber must be in E.164 format (e.g., +18095551234)',
  })
  whatsappNumber!: string;
}

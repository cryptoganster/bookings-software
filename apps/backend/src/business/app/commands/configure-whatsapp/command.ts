import { Command } from '@shared/kernel';

/**
 * ConfigureWhatsAppCommand
 *
 * Command to configure WhatsApp phone number for a business.
 *
 * Requirements: 3.1-3.5, 10.3
 */
export class ConfigureWhatsAppCommand extends Command<void> {
  constructor(
    public readonly businessId: string,
    public readonly whatsappPhone: string,
  ) {
    super();
  }
}

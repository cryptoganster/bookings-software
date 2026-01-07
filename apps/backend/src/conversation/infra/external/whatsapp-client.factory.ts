import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WhatsAppBusinessApiClient } from '@conversation/infra/external/whatsapp-business-api-client';
import { TwilioWhatsAppClient } from '@conversation/infra/external/twilio-whatsapp-client';
import { IWhatsAppClient } from '@conversation/domain/interfaces/external/whatsapp-client';

/**
 * Factory provider para seleccionar el cliente de WhatsApp según configuración.
 *
 * Usa WHATSAPP_PROVIDER env var para seleccionar:
 * - 'meta' (default): WhatsApp Business API oficial de Meta
 * - 'twilio': Twilio WhatsApp Sandbox (recomendado para desarrollo)
 *
 * Ejemplo .env:
 *   WHATSAPP_PROVIDER=twilio
 *   TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
 *   TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
 *   TWILIO_WHATSAPP_FROM=+14155238886
 */
export const WhatsAppClientProvider: Provider = {
  provide: 'IWhatsAppClient',
  useFactory: (configService: ConfigService): IWhatsAppClient => {
    const provider = configService.get<string>('WHATSAPP_PROVIDER', 'meta');

    if (provider === 'twilio') {
      return new TwilioWhatsAppClient(configService);
    }

    return new WhatsAppBusinessApiClient(configService);
  },
  inject: [ConfigService],
};

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  IWhatsAppClient,
  Button,
  Location,
} from '@conversation/domain/interfaces/external/whatsapp-client';

/**
 * Twilio WhatsApp Sandbox Client
 *
 * Alternativa a la API oficial de Meta para desarrollo y testing.
 * Usa el Twilio WhatsApp Sandbox que no requiere verificación de negocio.
 *
 * Setup:
 * 1. Crear cuenta en https://www.twilio.com/console
 * 2. Ir a Messaging → Try it out → Send a WhatsApp message
 * 3. Enviar "join <codigo>" al número del sandbox desde tu WhatsApp
 * 4. Configurar las variables de entorno TWILIO_*
 *
 * Limitaciones del Sandbox:
 * - Solo funciona con números que han enviado "join <codigo>"
 * - Mensajes expiran después de 24h de inactividad
 * - No soporta templates de WhatsApp Business
 * - Botones interactivos se envían como texto formateado
 */
@Injectable()
export class TwilioWhatsAppClient implements IWhatsAppClient {
  private readonly logger = new Logger(TwilioWhatsAppClient.name);
  private readonly accountSid: string;
  private readonly authToken: string;
  private readonly fromNumber: string;
  private readonly apiUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.accountSid = configService.get<string>('TWILIO_ACCOUNT_SID') || '';
    this.authToken = configService.get<string>('TWILIO_AUTH_TOKEN') || '';
    this.fromNumber = configService.get<string>('TWILIO_WHATSAPP_FROM') || '';

    // Twilio Messages API endpoint
    this.apiUrl = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`;

    if (!this.accountSid || !this.authToken || !this.fromNumber) {
      this.logger.warn(
        'Twilio credentials not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_WHATSAPP_FROM',
      );
    }
  }

  async sendMessage(to: string, message: string): Promise<void> {
    const maxRetries = 3;
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        await this.sendTwilioMessage(to, message);
        this.logger.debug(`Message sent to ${to}`);
        return;
      } catch (error) {
        attempt++;
        if (attempt >= maxRetries) {
          this.logger.error(`Failed to send message after ${maxRetries} attempts`, error);
          throw new Error(`Failed to send WhatsApp message after ${maxRetries} attempts`);
        }
        // Exponential backoff: 1s, 2s, 4s
        await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
      }
    }
  }

  async sendInteractiveButtons(to: string, message: string, buttons: Button[]): Promise<void> {
    // Twilio Sandbox no soporta botones interactivos nativos de WhatsApp
    // Simulamos con texto formateado
    const buttonText = buttons.map((btn, i) => `${i + 1}. ${btn.title}`).join('\n');
    const fullMessage = `${message}\n\n${buttonText}\n\n_Responde con el número de tu opción_`;

    await this.sendMessage(to, fullMessage);
  }

  async sendInteractiveList(
    to: string,
    message: string,
    buttonText: string,
    sections: Array<{
      title?: string;
      rows: Array<{ title: string; description?: string; id: string }>;
    }>,
  ): Promise<void> {
    // Twilio Sandbox no soporta listas interactivas nativas de WhatsApp
    // Simulamos con texto formateado
    let listText = `${message}\n\n`;

    sections.forEach((section) => {
      if (section.title) {
        listText += `*${section.title}*\n`;
      }
      section.rows.forEach((row, i: number) => {
        listText += `${i + 1}. ${row.title}`;
        if (row.description) {
          listText += ` - ${row.description}`;
        }
        listText += '\n';
      });
      listText += '\n';
    });

    listText += `_Responde con el número de tu opción_`;

    await this.sendMessage(to, listText);
  }

  async sendLocation(to: string, location: Location): Promise<void> {
    // Twilio Sandbox no soporta mensajes de ubicación nativos
    // Enviamos como texto con link de Google Maps
    const mapsUrl = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
    const message = `📍 *${location.name}*\n${location.address}\n\n${mapsUrl}`;

    await this.sendMessage(to, message);
  }

  private async sendTwilioMessage(to: string, body: string): Promise<void> {
    // Formatear números para Twilio WhatsApp
    const toWhatsApp = this.formatWhatsAppNumber(to);
    const fromWhatsApp = this.fromNumber.startsWith('whatsapp:')
      ? this.fromNumber
      : `whatsapp:${this.fromNumber}`;

    // Twilio usa form-urlencoded, no JSON
    const params = new URLSearchParams();
    params.append('To', toWhatsApp);
    params.append('From', fromWhatsApp);
    params.append('Body', body);

    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      this.logger.error(`Twilio API error: ${response.status} - ${errorBody}`);
      throw new Error(`Twilio API error: ${response.status}`);
    }

    const result = await response.json();
    this.logger.debug(`Message SID: ${result.sid}, Status: ${result.status}`);
  }

  private formatWhatsAppNumber(phone: string): string {
    // Si ya tiene el prefijo whatsapp:, retornar tal cual
    if (phone.startsWith('whatsapp:')) {
      return phone;
    }

    // Limpiar el número y agregar prefijo
    const cleanNumber = phone.replace(/[^0-9+]/g, '');
    return `whatsapp:${cleanNumber}`;
  }
}

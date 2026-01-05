import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import {
  IWhatsAppClient,
  Button,
  ListSection,
  Location,
} from '@conversation/domain/interfaces/external/whatsapp-client';

@Injectable()
export class WhatsAppBusinessApiClient implements IWhatsAppClient {
  private readonly apiUrl: string;
  private readonly accessToken: string;
  private readonly axiosInstance: AxiosInstance;

  constructor(private readonly configService: ConfigService) {
    this.apiUrl = configService.get<string>('WHATSAPP_API_URL') || '';
    this.accessToken = configService.get<string>('WHATSAPP_ACCESS_TOKEN') || '';

    this.axiosInstance = axios.create({
      baseURL: this.apiUrl,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
    });
  }

  async sendMessage(to: string, message: string): Promise<void> {
    const maxRetries = 3;
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        await this.axiosInstance.post('/messages', {
          messaging_product: 'whatsapp',
          to,
          type: 'text',
          text: { body: message },
        });
        return;
      } catch {
        attempt++;
        if (attempt >= maxRetries) {
          throw new Error(`Failed to send WhatsApp message after ${maxRetries} attempts`);
        }
        // Exponential backoff: 1s, 2s, 4s
        await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
      }
    }
  }

  async sendInteractiveButtons(to: string, message: string, buttons: Button[]): Promise<void> {
    const maxRetries = 3;
    let attempt = 0;
    let lastError: Error | null = null;

    while (attempt < maxRetries) {
      try {
        const payload = {
          messaging_product: 'whatsapp',
          to,
          type: 'interactive',
          interactive: {
            type: 'button',
            body: { text: message },
            action: {
              buttons: buttons.map((btn) => ({
                type: 'reply',
                reply: {
                  id: btn.id,
                  title: btn.title,
                },
              })),
            },
          },
        };

        console.log('[WhatsAppBusinessApiClient] Sending interactive buttons:', {
          to,
          buttonsCount: buttons.length,
          apiUrl: this.apiUrl,
          payload: JSON.stringify(payload, null, 2),
        });

        const response = await this.axiosInstance.post('/messages', payload);

        console.log('[WhatsAppBusinessApiClient] Response:', {
          status: response.status,
          data: response.data,
        });

        return;
      } catch (error: any) {
        lastError = error;
        attempt++;

        console.error('[WhatsAppBusinessApiClient] Error sending interactive buttons:', {
          attempt,
          maxRetries,
          error: error.message,
          response: error.response?.data,
          status: error.response?.status,
          to,
          buttonsCount: buttons.length,
        });

        if (attempt >= maxRetries) {
          throw new Error(
            `Failed to send WhatsApp interactive buttons after ${maxRetries} attempts. Last error: ${lastError?.message}. Response: ${JSON.stringify(error.response?.data)}`,
          );
        }
        // Exponential backoff: 1s, 2s, 4s
        await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
      }
    }
  }

  async sendInteractiveList(
    to: string,
    bodyText: string,
    buttonText: string,
    sections: ListSection[],
  ): Promise<void> {
    const maxRetries = 3;
    let attempt = 0;
    let lastError: Error | null = null;

    while (attempt < maxRetries) {
      try {
        const payload = {
          messaging_product: 'whatsapp',
          to,
          type: 'interactive',
          interactive: {
            type: 'list',
            body: { text: bodyText },
            action: {
              button: buttonText,
              sections: sections.map((section) => ({
                title: section.title,
                rows: section.rows.map((row) => ({
                  id: row.id,
                  title: row.title,
                  description: row.description,
                })),
              })),
            },
          },
        };

        console.log('[WhatsAppBusinessApiClient] Sending interactive list:', {
          to,
          sectionsCount: sections.length,
          totalRows: sections.reduce((sum, s) => sum + s.rows.length, 0),
          apiUrl: this.apiUrl,
          payload: JSON.stringify(payload, null, 2),
        });

        const response = await this.axiosInstance.post('/messages', payload);

        console.log('[WhatsAppBusinessApiClient] Response:', {
          status: response.status,
          data: response.data,
        });

        return;
      } catch (error: any) {
        lastError = error;
        attempt++;

        console.error('[WhatsAppBusinessApiClient] Error sending interactive list:', {
          attempt,
          maxRetries,
          error: error.message,
          response: error.response?.data,
          status: error.response?.status,
          to,
          sectionsCount: sections.length,
        });

        if (attempt >= maxRetries) {
          throw new Error(
            `Failed to send WhatsApp interactive list after ${maxRetries} attempts. Last error: ${lastError?.message}. Response: ${JSON.stringify(error.response?.data)}`,
          );
        }
        // Exponential backoff: 1s, 2s, 4s
        await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
      }
    }
  }

  async sendLocation(to: string, location: Location): Promise<void> {
    const maxRetries = 3;
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        await this.axiosInstance.post('/messages', {
          messaging_product: 'whatsapp',
          to,
          type: 'location',
          location: {
            latitude: location.latitude,
            longitude: location.longitude,
            name: location.name,
            address: location.address,
          },
        });
        return;
      } catch {
        attempt++;
        if (attempt >= maxRetries) {
          throw new Error(`Failed to send WhatsApp location after ${maxRetries} attempts`);
        }
        // Exponential backoff: 1s, 2s, 4s
        await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
      }
    }
  }
}

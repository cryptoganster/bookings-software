import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import {
  IWhatsAppClient,
  Button,
  Location,
} from '../../domain/interfaces/external/whatsapp-client';

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

    while (attempt < maxRetries) {
      try {
        await this.axiosInstance.post('/messages', {
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
        });
        return;
      } catch {
        attempt++;
        if (attempt >= maxRetries) {
          throw new Error(
            `Failed to send WhatsApp interactive buttons after ${maxRetries} attempts`,
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

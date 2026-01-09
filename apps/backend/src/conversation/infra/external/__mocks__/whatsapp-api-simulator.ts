import { Injectable, Logger } from '@nestjs/common';
import * as express from 'express';
import { Express } from 'express';
import { Server } from 'http';
import * as crypto from 'crypto';

/**
 * WhatsApp API Simulator for Integration Testing
 *
 * Propósito:
 * - Simular el comportamiento de WhatsApp Business API sin hacer llamadas reales
 * - Proporcionar endpoints HTTP que imitan la API de WhatsApp
 * - Simular webhooks de mensajes entrantes
 * - Permitir testing de integración sin credenciales reales
 *
 * Características:
 * - Simula envío de mensajes (POST /v18.0/{phone_number_id}/messages)
 * - Simula recepción de mensajes (webhook callbacks)
 * - Valida formato de requests
 * - Genera message IDs únicos
 * - Simula delays de red
 * - Simula errores de API
 *
 * Uso en tests:
 * ```typescript
 * const simulator = new WhatsAppApiSimulator();
 * await simulator.start(3001);
 *
 * // Configurar webhook callback
 * simulator.setWebhookUrl('http://localhost:3000/webhooks/whatsapp');
 *
 * // Simular mensaje entrante
 * await simulator.simulateIncomingMessage('+1234567890', 'Hello');
 *
 * // Cleanup
 * await simulator.stop();
 * ```
 */

interface SendMessageRequest {
  messaging_product: 'whatsapp';
  recipient_type?: 'individual';
  to: string;
  type: 'text' | 'interactive';
  text?: {
    preview_url?: boolean;
    body: string;
  };
  interactive?: {
    type: 'button' | 'list';
    body?: {
      text: string;
    };
    action?: {
      buttons?: Array<{
        type: 'reply';
        reply: {
          id: string;
          title: string;
        };
      }>;
      button?: string;
      sections?: Array<{
        title?: string;
        rows: Array<{
          id: string;
          title: string;
          description?: string;
        }>;
      }>;
    };
  };
}

interface SendMessageResponse {
  messaging_product: 'whatsapp';
  contacts: Array<{
    input: string;
    wa_id: string;
  }>;
  messages: Array<{
    id: string;
  }>;
}

interface IncomingMessage {
  from: string;
  id: string;
  timestamp: string;
  text?: {
    body: string;
  };
  type: 'text' | 'interactive';
  interactive?: {
    type: 'button_reply' | 'list_reply';
    button_reply?: {
      id: string;
      title: string;
    };
    list_reply?: {
      id: string;
      title: string;
      description?: string;
    };
  };
}

interface WebhookPayload {
  object: 'whatsapp_business_account';
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: 'whatsapp';
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        contacts?: Array<{
          profile: {
            name: string;
          };
          wa_id: string;
        }>;
        messages?: IncomingMessage[];
      };
      field: 'messages';
    }>;
  }>;
}

@Injectable()
export class WhatsAppApiSimulator {
  private readonly logger = new Logger(WhatsAppApiSimulator.name);
  private app: Express;
  private server: Server | null = null;
  private port: number = 0;

  // Configuration
  private webhookUrl: string | null = null;
  private phoneNumberId: string = 'test-phone-number-id';
  private displayPhoneNumber: string = '+15551234567';
  private businessAccountId: string = 'test-business-account-id';

  // Tracking
  private sentMessages: SendMessageRequest[] = [];
  private receivedMessages: IncomingMessage[] = [];

  // Behavior configuration
  private shouldFailSendMessage = false;
  private sendMessageErrorCode = 500;
  private sendMessageErrorMessage = 'Internal Server Error';
  private networkDelayMs = 0;

  constructor() {
    this.app = express();
    this.app.use(express.json());
    this.setupRoutes();
  }

  /**
   * Configura las rutas del simulador
   */
  private setupRoutes(): void {
    // Endpoint para enviar mensajes (simula WhatsApp API)
    this.app.post('/v18.0/:phoneNumberId/messages', async (req, res) => {
      await this.simulateNetworkDelay();

      const body = req.body as SendMessageRequest;

      this.logger.log(`Received send message request to ${body.to}`);

      // Validar request
      if (!body.messaging_product || body.messaging_product !== 'whatsapp') {
        return res.status(400).json({
          error: {
            message: 'Invalid messaging_product',
            type: 'invalid_parameter',
            code: 100,
          },
        });
      }

      if (!body.to) {
        return res.status(400).json({
          error: {
            message: 'Missing required parameter: to',
            type: 'invalid_parameter',
            code: 100,
          },
        });
      }

      // Simular error si está configurado
      if (this.shouldFailSendMessage) {
        return res.status(this.sendMessageErrorCode).json({
          error: {
            message: this.sendMessageErrorMessage,
            type: 'api_error',
            code: this.sendMessageErrorCode,
          },
        });
      }

      // Guardar mensaje enviado
      this.sentMessages.push(body);

      // Generar respuesta exitosa
      const messageId = this.generateMessageId();
      const response: SendMessageResponse = {
        messaging_product: 'whatsapp',
        contacts: [
          {
            input: body.to,
            wa_id: body.to.replace('+', ''),
          },
        ],
        messages: [
          {
            id: messageId,
          },
        ],
      };

      this.logger.log(`Message sent successfully with ID: ${messageId}`);
      res.status(200).json(response);
    });

    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.status(200).json({ status: 'ok', simulator: 'whatsapp-api' });
    });
  }

  /**
   * Inicia el servidor del simulador
   */
  async start(port: number = 0): Promise<number> {
    return new Promise((resolve, reject) => {
      try {
        this.server = this.app.listen(port, () => {
          const address = this.server!.address();
          if (typeof address === 'object' && address !== null) {
            this.port = address.port;
            this.logger.log(`WhatsApp API Simulator started on port ${this.port}`);
            resolve(this.port);
          } else {
            reject(new Error('Failed to get server address'));
          }
        });

        this.server.on('error', (error) => {
          this.logger.error('Server error', error);
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Detiene el servidor del simulador
   */
  async stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.server) {
        this.server.close((error) => {
          if (error) {
            this.logger.error('Error stopping server', error);
            reject(error);
          } else {
            this.logger.log('WhatsApp API Simulator stopped');
            this.server = null;
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * Configura la URL del webhook para callbacks
   */
  setWebhookUrl(url: string): void {
    this.webhookUrl = url;
    this.logger.log(`Webhook URL set to: ${url}`);
  }

  /**
   * Configura el phone number ID del simulador
   */
  setPhoneNumberId(phoneNumberId: string): void {
    this.phoneNumberId = phoneNumberId;
  }

  /**
   * Configura el display phone number del simulador
   */
  setDisplayPhoneNumber(phoneNumber: string): void {
    this.displayPhoneNumber = phoneNumber;
  }

  /**
   * Simula un mensaje entrante de un cliente
   */
  async simulateIncomingMessage(
    from: string,
    messageText: string,
    customerName: string = 'Test Customer',
  ): Promise<void> {
    if (!this.webhookUrl) {
      throw new Error('Webhook URL not configured. Call setWebhookUrl() first.');
    }

    await this.simulateNetworkDelay();

    const message: IncomingMessage = {
      from: from.replace('+', ''), // WhatsApp API sends without +
      id: this.generateMessageId(),
      timestamp: Date.now().toString(),
      type: 'text',
      text: {
        body: messageText,
      },
    };

    this.receivedMessages.push(message);

    const payload: WebhookPayload = {
      object: 'whatsapp_business_account',
      entry: [
        {
          id: this.businessAccountId,
          changes: [
            {
              value: {
                messaging_product: 'whatsapp',
                metadata: {
                  display_phone_number: this.displayPhoneNumber,
                  phone_number_id: this.phoneNumberId,
                },
                contacts: [
                  {
                    profile: {
                      name: customerName,
                    },
                    wa_id: from.replace('+', ''),
                  },
                ],
                messages: [message],
              },
              field: 'messages',
            },
          ],
        },
      ],
    };

    this.logger.log(`Simulating incoming message from ${from}: "${messageText}"`);

    // Enviar webhook al servidor
    try {
      const axios = (await import('axios')).default;
      const response = await axios.post(this.webhookUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
        },
        validateStatus: () => true, // Don't throw on any status
      });

      if (response.status !== 200) {
        this.logger.warn(`Webhook returned status ${response.status}`);
      } else {
        this.logger.log('Webhook delivered successfully');
      }
    } catch (error) {
      this.logger.error('Failed to deliver webhook', error);
      throw error;
    }
  }

  /**
   * Simula un mensaje interactivo con botón
   */
  async simulateIncomingButtonReply(
    from: string,
    buttonId: string,
    buttonTitle: string,
    customerName: string = 'Test Customer',
  ): Promise<void> {
    if (!this.webhookUrl) {
      throw new Error('Webhook URL not configured. Call setWebhookUrl() first.');
    }

    await this.simulateNetworkDelay();

    const message: IncomingMessage = {
      from: from.replace('+', ''),
      id: this.generateMessageId(),
      timestamp: Date.now().toString(),
      type: 'interactive',
      interactive: {
        type: 'button_reply',
        button_reply: {
          id: buttonId,
          title: buttonTitle,
        },
      },
    };

    this.receivedMessages.push(message);

    const payload: WebhookPayload = {
      object: 'whatsapp_business_account',
      entry: [
        {
          id: this.businessAccountId,
          changes: [
            {
              value: {
                messaging_product: 'whatsapp',
                metadata: {
                  display_phone_number: this.displayPhoneNumber,
                  phone_number_id: this.phoneNumberId,
                },
                contacts: [
                  {
                    profile: {
                      name: customerName,
                    },
                    wa_id: from.replace('+', ''),
                  },
                ],
                messages: [message],
              },
              field: 'messages',
            },
          ],
        },
      ],
    };

    this.logger.log(`Simulating button reply from ${from}: ${buttonId} - "${buttonTitle}"`);

    try {
      const axios = (await import('axios')).default;
      const response = await axios.post(this.webhookUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
        },
        validateStatus: () => true,
      });

      if (response.status !== 200) {
        this.logger.warn(`Webhook returned status ${response.status}`);
      } else {
        this.logger.log('Webhook delivered successfully');
      }
    } catch (error) {
      this.logger.error('Failed to deliver webhook', error);
      throw error;
    }
  }

  /**
   * Simula un mensaje interactivo con lista
   */
  async simulateIncomingListReply(
    from: string,
    listItemId: string,
    listItemTitle: string,
    listItemDescription: string | undefined,
    customerName: string = 'Test Customer',
  ): Promise<void> {
    if (!this.webhookUrl) {
      throw new Error('Webhook URL not configured. Call setWebhookUrl() first.');
    }

    await this.simulateNetworkDelay();

    const message: IncomingMessage = {
      from: from.replace('+', ''),
      id: this.generateMessageId(),
      timestamp: Date.now().toString(),
      type: 'interactive',
      interactive: {
        type: 'list_reply',
        list_reply: {
          id: listItemId,
          title: listItemTitle,
          description: listItemDescription,
        },
      },
    };

    this.receivedMessages.push(message);

    const payload: WebhookPayload = {
      object: 'whatsapp_business_account',
      entry: [
        {
          id: this.businessAccountId,
          changes: [
            {
              value: {
                messaging_product: 'whatsapp',
                metadata: {
                  display_phone_number: this.displayPhoneNumber,
                  phone_number_id: this.phoneNumberId,
                },
                contacts: [
                  {
                    profile: {
                      name: customerName,
                    },
                    wa_id: from.replace('+', ''),
                  },
                ],
                messages: [message],
              },
              field: 'messages',
            },
          ],
        },
      ],
    };

    this.logger.log(`Simulating list reply from ${from}: ${listItemId} - "${listItemTitle}"`);

    try {
      const axios = (await import('axios')).default;
      const response = await axios.post(this.webhookUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
        },
        validateStatus: () => true,
      });

      if (response.status !== 200) {
        this.logger.warn(`Webhook returned status ${response.status}`);
      } else {
        this.logger.log('Webhook delivered successfully');
      }
    } catch (error) {
      this.logger.error('Failed to deliver webhook', error);
      throw error;
    }
  }

  // ========== Configuration Methods ==========

  /**
   * Configura el simulador para que falle en el próximo envío de mensaje
   */
  setShouldFailSendMessage(
    shouldFail: boolean,
    errorCode: number = 500,
    errorMessage: string = 'Internal Server Error',
  ): void {
    this.shouldFailSendMessage = shouldFail;
    this.sendMessageErrorCode = errorCode;
    this.sendMessageErrorMessage = errorMessage;
  }

  /**
   * Configura un delay artificial para simular latencia de red
   */
  setNetworkDelay(delayMs: number): void {
    this.networkDelayMs = delayMs;
  }

  // ========== Query Methods ==========

  /**
   * Obtiene todos los mensajes enviados
   */
  getSentMessages(): SendMessageRequest[] {
    return [...this.sentMessages];
  }

  /**
   * Obtiene todos los mensajes recibidos (simulados)
   */
  getReceivedMessages(): IncomingMessage[] {
    return [...this.receivedMessages];
  }

  /**
   * Obtiene el último mensaje enviado a un destinatario
   */
  getLastSentMessageTo(to: string): SendMessageRequest | undefined {
    return this.sentMessages.filter((msg) => msg.to === to).pop();
  }

  /**
   * Verifica si se envió un mensaje de texto específico
   */
  hasTextMessageBeenSent(to: string, text: string): boolean {
    return this.sentMessages.some(
      (msg) => msg.to === to && msg.type === 'text' && msg.text?.body === text,
    );
  }

  /**
   * Verifica si se enviaron botones interactivos
   */
  hasInteractiveButtonsBeenSent(to: string): boolean {
    return this.sentMessages.some(
      (msg) => msg.to === to && msg.type === 'interactive' && msg.interactive?.type === 'button',
    );
  }

  /**
   * Verifica si se envió una lista interactiva
   */
  hasInteractiveListBeenSent(to: string): boolean {
    return this.sentMessages.some(
      (msg) => msg.to === to && msg.type === 'interactive' && msg.interactive?.type === 'list',
    );
  }

  /**
   * Obtiene la URL base del simulador
   */
  getBaseUrl(): string {
    if (!this.server) {
      throw new Error('Server not started. Call start() first.');
    }
    return `http://localhost:${this.port}`;
  }

  /**
   * Obtiene el puerto del simulador
   */
  getPort(): number {
    return this.port;
  }

  /**
   * Limpia todos los mensajes y configuraciones
   */
  reset(): void {
    this.sentMessages = [];
    this.receivedMessages = [];
    this.shouldFailSendMessage = false;
    this.sendMessageErrorCode = 500;
    this.sendMessageErrorMessage = 'Internal Server Error';
    this.networkDelayMs = 0;
    this.webhookUrl = null;
  }

  // ========== Private Helper Methods ==========

  /**
   * Genera un message ID único
   */
  private generateMessageId(): string {
    return `wamid.${crypto.randomBytes(16).toString('hex')}`;
  }

  /**
   * Simula delay de red
   */
  private async simulateNetworkDelay(): Promise<void> {
    if (this.networkDelayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.networkDelayMs));
    }
  }
}

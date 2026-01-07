import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Req,
  Res,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { WhatsAppSignatureGuard } from '@conversation/presentation/guards/whatsapp-signature';
import { ProcessIncomingMessageCommand } from '@conversation/app/commands/process-incoming-message/command';
import type { FastifyRequest, FastifyReply } from 'fastify';

interface WhatsAppWebhookPayload {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
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
        messages?: Array<{
          from: string;
          id: string;
          timestamp: string;
          text?: {
            body: string;
          };
          type: string;
          interactive?: {
            type: string;
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
        }>;
      };
      field: string;
    }>;
  }>;
}

@Controller('webhooks/whatsapp')
@UseGuards(WhatsAppSignatureGuard)
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(private readonly commandBus: CommandBus) {}

  /**
   * Endpoint para verificación de webhook (GET)
   * WhatsApp envía este request para verificar el webhook
   */
  @Get()
  async verifyWebhook(@Req() req: FastifyRequest, @Res() res: FastifyReply) {
    const challenge = (req as FastifyRequest & { webhookChallenge?: string }).webhookChallenge;

    if (challenge) {
      return res.status(HttpStatus.OK).send(challenge);
    }

    return res.status(HttpStatus.FORBIDDEN).send('Forbidden');
  }

  /**
   * Endpoint para recibir mensajes de WhatsApp (POST)
   */
  @Post()
  async handleIncomingMessage(@Body() payload: WhatsAppWebhookPayload) {
    try {
      this.logger.log('Received WhatsApp webhook payload');

      // Validar que sea un mensaje de WhatsApp
      if (payload.object !== 'whatsapp_business_account') {
        this.logger.warn('Ignored: not a whatsapp message');
        return { status: 'ignored', reason: 'not a whatsapp message' };
      }

      // Procesar cada entrada del webhook
      for (const entry of payload.entry) {
        for (const change of entry.changes) {
          // Solo procesar cambios de mensajes
          if (change.field !== 'messages') {
            continue;
          }

          const { messages, metadata } = change.value;

          // Si no hay mensajes, ignorar
          if (!messages || messages.length === 0) {
            continue;
          }

          // Procesar cada mensaje
          for (const message of messages) {
            // Extraer información del mensaje
            // WhatsApp API sends phone without '+' prefix, we need to add it for E.164 format
            const customerPhone = message.from.startsWith('+') ? message.from : `+${message.from}`;
            const businessWhatsAppNumber = metadata.display_phone_number;

            this.logger.log({
              customerPhone,
              businessWhatsAppNumber,
              messageType: message.type,
            });

            // TODO: En multi-tenant, buscar businessId por businessWhatsAppNumber
            // Por ahora, usar un businessId hardcoded para MVP single-tenant
            // Este businessId debe existir en la tabla businesses
            const businessId = process.env.DEFAULT_BUSINESS_ID || 'REPLACE_WITH_ACTUAL_BUSINESS_ID';

            let messageText = '';
            let buttonId: string | undefined;

            // Determinar el tipo de mensaje
            if (message.type === 'text' && message.text) {
              messageText = message.text.body;
            } else if (message.type === 'interactive' && message.interactive) {
              // Handle button replies (max 3 buttons)
              if (message.interactive.button_reply) {
                buttonId = message.interactive.button_reply.id;
                messageText = message.interactive.button_reply.title;
              }
              // Handle list replies (up to 10 items per section)
              else if (message.interactive.list_reply) {
                buttonId = message.interactive.list_reply.id;
                messageText = message.interactive.list_reply.title;
              } else {
                this.logger.warn(`Unsupported interactive type: ${message.interactive.type}`);
                continue;
              }
            } else {
              // Tipo de mensaje no soportado
              this.logger.warn(`Unsupported message type: ${message.type}`);
              continue;
            }

            this.logger.log(`Processing message: "${messageText}" from ${customerPhone}`);

            // Despachar comando para procesar el mensaje
            await this.commandBus.execute(
              new ProcessIncomingMessageCommand(
                businessId, // businessId real de la tabla businesses
                customerPhone, // customerId (identificado por número de teléfono)
                customerPhone, // customerPhone
                messageText,
                buttonId,
              ),
            );
          }
        }
      }

      // Responder con 200 OK para confirmar recepción
      return { status: 'success' };
    } catch (error) {
      // Log error but respond with 200 to avoid WhatsApp retries
      this.logger.error('Error processing WhatsApp webhook', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      return { status: 'error', message: 'Internal error' };
    }
  }
}

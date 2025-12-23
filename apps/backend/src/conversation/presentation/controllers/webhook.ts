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
      // Validar que sea un mensaje de WhatsApp
      if (payload.object !== 'whatsapp_business_account') {
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
            const customerPhone = message.from;
            const businessPhoneId = metadata.phone_number_id;

            let messageText = '';
            let buttonId: string | undefined;

            // Determinar el tipo de mensaje
            if (message.type === 'text' && message.text) {
              messageText = message.text.body;
            } else if (message.type === 'interactive' && message.interactive?.button_reply) {
              buttonId = message.interactive.button_reply.id;
              messageText = message.interactive.button_reply.title;
            } else {
              // Tipo de mensaje no soportado
              continue;
            }

            // Despachar comando para procesar el mensaje
            await this.commandBus.execute(
              new ProcessIncomingMessageCommand(
                businessPhoneId, // businessId (identificado por phone_number_id)
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
      this.logger.error(
        'Error processing WhatsApp webhook',
        error instanceof Error ? error.stack : String(error),
        {
          error: error instanceof Error ? error.message : String(error),
          payload: JSON.stringify(payload),
        },
      );
      return { status: 'error', message: 'Internal error' };
    }
  }
}

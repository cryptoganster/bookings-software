import { Command } from '@nestjs/cqrs';

/**
 * SendWhatsAppMessageCommand
 *
 * Comando para enviar un mensaje de WhatsApp a un cliente.
 *
 * @remarks
 * - Extiende Command<TResult> para tipado fuerte del resultado
 * - Incluye retry logic en el handler (3 intentos con exponential backoff)
 * - Crea un Message aggregate y lo persiste
 * - Llama al WhatsApp Business API
 */
export class SendWhatsAppMessageCommand extends Command<{ messageId: string }> {
  constructor(
    public readonly conversationId: string,
    public readonly content: string,
    public readonly messageType: 'TEXT' | 'BUTTON' | 'LOCATION',
    public readonly recipientPhone: string,
    public readonly isFromAdmin: boolean = false,
  ) {
    super();
  }
}

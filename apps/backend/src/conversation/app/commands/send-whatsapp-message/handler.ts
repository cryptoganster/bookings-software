import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { SendWhatsAppMessageCommand } from '@conversation/app/commands/send-whatsapp-message/command';
import { Message } from '@conversation/domain/aggregates/message';
import { UUID } from '@shared/vo/uuid';
import { MessageDirection } from '@conversation/domain/vo/message-direction';
import { MessageType } from '@conversation/domain/vo/message-type';
import { IMessageWriteRepository } from '@conversation/domain/interfaces/repositories/message-write.repository.interface';
import { IWhatsAppClient } from '@conversation/domain/interfaces/external/whatsapp-client';
import { IUnitOfWork } from '@shared/kernel/uow';
import { WhatsAppMessageFailedException } from '@conversation/domain/exceptions/whatsapp-message-failed.exception';

/**
 * SendWhatsAppMessageHandler
 *
 * Handler para enviar mensajes de WhatsApp con retry logic.
 *
 * @remarks
 * - Crea Message aggregate
 * - Llama WhatsApp API con retry (3 intentos, exponential backoff)
 * - Persiste mensaje en transacción
 * - Publica MessageSent event automáticamente
 */
@CommandHandler(SendWhatsAppMessageCommand)
export class SendWhatsAppMessageHandler implements ICommandHandler<SendWhatsAppMessageCommand> {
  private readonly MAX_RETRIES = 3;
  private readonly BASE_DELAY_MS = 100;

  constructor(
    @Inject('IMessageWriteRepository')
    private readonly messageRepository: IMessageWriteRepository,
    @Inject('IWhatsAppClient')
    private readonly whatsappClient: IWhatsAppClient,
    @Inject('IUnitOfWork')
    private readonly uow: IUnitOfWork,
  ) {}

  async execute(command: SendWhatsAppMessageCommand): Promise<{ messageId: string }> {
    const messageId = UUID.generate();

    // Crear Message aggregate
    const message = Message.create(
      messageId,
      UUID.fromString(command.conversationId),
      MessageDirection.outbound(), // Siempre OUTBOUND (al cliente)
      command.content,
      MessageType.fromString(command.messageType),
      command.isFromAdmin,
    );

    // Intentar enviar mensaje con retry logic
    await this.sendWithRetry(
      command.recipientPhone,
      command.content,
      command.messageType,
      command.conversationId,
    );

    // Persistir mensaje en transacción
    await this.uow.transaction(async () => {
      await this.messageRepository.save(message);
    });

    return { messageId: messageId.getValue() };
  }

  /**
   * Envía mensaje con retry logic y exponential backoff
   *
   * @param to - Número de teléfono del destinatario
   * @param content - Contenido del mensaje
   * @param messageType - Tipo de mensaje (TEXT/BUTTON/LOCATION)
   * @param conversationId - ID de la conversación (para logging)
   * @throws WhatsAppMessageFailedException si falla después de todos los reintentos
   */
  private async sendWithRetry(
    to: string,
    content: string,
    messageType: string,
    conversationId: string,
  ): Promise<void> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.MAX_RETRIES; attempt++) {
      try {
        // Enviar según el tipo de mensaje
        if (messageType === 'TEXT') {
          await this.whatsappClient.sendMessage(to, content);
        } else if (messageType === 'BUTTON') {
          // TODO: Parse buttons from content (future enhancement)
          await this.whatsappClient.sendMessage(to, content);
        } else if (messageType === 'LOCATION') {
          // TODO: Parse location from content (future enhancement)
          await this.whatsappClient.sendMessage(to, content);
        }

        // Éxito - salir del loop
        return;
      } catch (error) {
        lastError = error as Error;

        // Si no es el último intento, esperar antes de reintentar
        if (attempt < this.MAX_RETRIES - 1) {
          const delay = this.BASE_DELAY_MS * Math.pow(2, attempt);
          await this.sleep(delay);
        }
      }
    }

    // Si llegamos aquí, fallaron todos los intentos
    throw new WhatsAppMessageFailedException(conversationId, lastError?.message || 'Unknown error');
  }

  /**
   * Utility para esperar un tiempo determinado
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

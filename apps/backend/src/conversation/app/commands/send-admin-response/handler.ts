import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { SendAdminResponseCommand } from '@conversation/app/commands/send-admin-response/command';
import { SendWhatsAppMessageCommand } from '@conversation/app/commands/send-whatsapp-message/command';
import { IConversationFactory } from '@conversation/domain/interfaces/factories/conversation-factory';
import { IConversationWriteRepository } from '@conversation/domain/interfaces/repositories/conversation-write';
import { UUID } from '@shared/vo/uuid';
import { ConcurrencyException } from '@shared/kernel/exceptions/concurrency';

/**
 * SendAdminResponseHandler
 *
 * Maneja el envío de respuestas de admin a consultas de clientes.
 *
 * @remarks
 * Flujo:
 * 1. Carga el aggregate Conversation usando Factory
 * 2. Ejecuta lógica de negocio: conversation.resolveAdminQuery()
 * 3. Persiste cambios usando Write Repository
 * 4. Envía el mensaje vía WhatsApp usando SendWhatsAppMessageCommand
 *
 * **Retry Logic:**
 * - Retries up to 3 times on ConcurrencyException
 * - Implements exponential backoff (100ms * 2^attempt)
 * - Reloads aggregate from database on each retry
 *
 * @throws NotFoundException si la conversación no existe
 * @throws Error si falla después de 3 intentos
 *
 * **Architecture Compliance:**
 * - Uses Factory pattern to load aggregate (CQRS strict)
 * - Uses domain method resolveAdminQuery() for business logic
 * - Uses Write Repository for persistence
 * - No direct database access
 * - No Read Repository in command handler
 */
@CommandHandler(SendAdminResponseCommand)
@Injectable()
export class SendAdminResponseHandler implements ICommandHandler<SendAdminResponseCommand> {
  private readonly MAX_RETRIES = 3;

  constructor(
    @Inject('IConversationFactory')
    private readonly conversationFactory: IConversationFactory,
    @Inject('IConversationWriteRepository')
    private readonly conversationWriteRepo: IConversationWriteRepository,
    private readonly commandBus: CommandBus,
  ) {}

  async execute(command: SendAdminResponseCommand): Promise<void> {
    let attempt = 0;

    while (attempt < this.MAX_RETRIES) {
      try {
        // 1. Load conversation aggregate using Factory
        const conversation = await this.conversationFactory.loadById(
          UUID.fromString(command.conversationId),
        );

        if (!conversation) {
          throw new NotFoundException(`Conversation with id ${command.conversationId} not found`);
        }

        // 2. Execute business logic - resolve admin query
        conversation.resolveAdminQuery();

        // 3. Persist changes using Write Repository
        await this.conversationWriteRepo.save(conversation);

        // 4. Send message via WhatsApp
        await this.commandBus.execute(
          new SendWhatsAppMessageCommand(
            command.conversationId,
            command.message,
            'TEXT',
            conversation.getCustomerPhone(), // Get from aggregate
            true, // isFromAdmin = true
          ),
        );

        // Success - exit retry loop
        return;
      } catch (error) {
        if (error instanceof ConcurrencyException) {
          attempt++;

          if (attempt >= this.MAX_RETRIES) {
            throw new Error(
              `Unable to send admin response after ${this.MAX_RETRIES} attempts due to concurrent modifications. Please try again.`,
            );
          }

          // Exponential backoff: 100ms * 2^attempt
          const backoffMs = 100 * Math.pow(2, attempt);
          await new Promise((resolve) => setTimeout(resolve, backoffMs));

          // Loop will retry with fresh aggregate load
        } else {
          // Not a concurrency error - propagate immediately
          throw error;
        }
      }
    }
  }
}

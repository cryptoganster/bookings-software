import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SendAdminResponseCommand } from '@conversation/app/commands/send-admin-response/command';
import { SendWhatsAppMessageCommand } from '@conversation/app/commands/send-whatsapp-message/command';
import { IConversationReadRepository } from '@conversation/domain/interfaces/repositories/conversation-read';
import { ConversationModel } from '@conversation/infra/persistence/models/conversation.model';

/**
 * SendAdminResponseHandler
 *
 * Maneja el envío de respuestas de admin a consultas de clientes.
 *
 * @remarks
 * Flujo:
 * 1. Obtiene datos de la conversación (para obtener customerPhone)
 * 2. Actualiza el status de la conversación a 'RESOLVED' directamente en BD
 * 3. Envía el mensaje vía WhatsApp usando SendWhatsAppMessageCommand
 *
 * @throws NotFoundException si la conversación no existe
 *
 * **Note:** This handler updates the conversation status directly in the database
 * without loading the aggregate because the status field is for admin query tracking,
 * not part of the conversation state machine (which uses the 'state' field).
 */
@CommandHandler(SendAdminResponseCommand)
@Injectable()
export class SendAdminResponseHandler implements ICommandHandler<SendAdminResponseCommand> {
  constructor(
    @InjectRepository(ConversationModel)
    private readonly conversationRepository: Repository<ConversationModel>,
    @Inject('IConversationReadRepository')
    private readonly conversationReadRepo: IConversationReadRepository,
    private readonly commandBus: CommandBus,
  ) {}

  async execute(command: SendAdminResponseCommand): Promise<void> {
    // 1. Get conversation data to obtain customerPhone
    const conversationData = await this.conversationReadRepo.findById(command.conversationId);

    if (!conversationData) {
      throw new NotFoundException(`Conversation with id ${command.conversationId} not found`);
    }

    // 2. Update conversation status to RESOLVED
    const result = await this.conversationRepository.update(
      { id: command.conversationId },
      { status: 'RESOLVED' },
    );

    if (result.affected === 0) {
      throw new NotFoundException(`Conversation with id ${command.conversationId} not found`);
    }

    // 3. Send message via WhatsApp
    await this.commandBus.execute(
      new SendWhatsAppMessageCommand(
        command.conversationId,
        command.message,
        'TEXT',
        conversationData.customerPhone,
        true, // isFromAdmin = true
      ),
    );
  }
}

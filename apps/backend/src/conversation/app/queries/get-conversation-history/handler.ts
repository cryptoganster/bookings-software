import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetConversationHistoryQuery } from '@conversation/app/queries/get-conversation-history/query';
import { MessageReadModel } from '@conversation/domain/read-models/message';
import { IMessageReadRepository } from '@conversation/domain/interfaces/repositories/message-read.repository.interface';

/**
 * GetConversationHistoryHandler
 *
 * Handler para obtener el historial de mensajes de una conversación.
 *
 * @remarks
 * - Usa MessageReadRepository (CQRS read side)
 * - Retorna mensajes ordenados por sentAt ASC (cronológico)
 * - Retorna array vacío si no hay mensajes
 * - No lanza excepción si la conversación no existe
 */
@QueryHandler(GetConversationHistoryQuery)
export class GetConversationHistoryHandler implements IQueryHandler<GetConversationHistoryQuery> {
  constructor(
    @Inject('IMessageReadRepository')
    private readonly messageReadRepository: IMessageReadRepository,
  ) {}

  async execute(query: GetConversationHistoryQuery): Promise<MessageReadModel[]> {
    // Obtener mensajes ordenados por fecha de envío
    const messages = await this.messageReadRepository.findByConversationId(query.conversationId);

    // Retornar mensajes (puede ser array vacío)
    return messages;
  }
}

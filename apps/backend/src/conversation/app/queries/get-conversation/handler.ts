import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetConversationQuery } from '@conversation/app/queries/get-conversation/query';
import { IConversationReadRepository } from '@conversation/domain/interfaces/repositories/conversation-read';
import { ConversationReadModel } from '@conversation/domain/read-models/conversation';

/**
 * GetConversationHandler
 *
 * Obtiene una conversación por ID con datos denormalizados del customer.
 *
 * @throws NotFoundException si la conversación no existe
 */
@QueryHandler(GetConversationQuery)
@Injectable()
export class GetConversationHandler implements IQueryHandler<GetConversationQuery> {
  constructor(
    @Inject('IConversationReadRepository')
    private readonly conversationReadRepo: IConversationReadRepository,
  ) {}

  async execute(query: GetConversationQuery): Promise<ConversationReadModel> {
    const conversation = await this.conversationReadRepo.findById(query.conversationId);

    if (!conversation) {
      throw new NotFoundException(`Conversation with id ${query.conversationId} not found`);
    }

    return conversation;
  }
}

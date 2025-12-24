import { Inject, Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetPendingAdminQueriesQuery } from '@conversation/app/queries/get-pending-admin-queries/query';
import { IConversationReadRepository } from '@conversation/domain/interfaces/repositories/conversation-read';
import { ConversationReadModel } from '@conversation/domain/read-models/conversation';

/**
 * GetPendingAdminQueriesHandler
 *
 * Obtiene todas las conversaciones pendientes de respuesta de admin para un negocio.
 *
 * @remarks
 * - Filtra por status = 'AWAITING_ADMIN'
 * - Ordena por lastMessageAt DESC (más recientes primero)
 * - Incluye datos denormalizados del customer (nombre, teléfono)
 */
@QueryHandler(GetPendingAdminQueriesQuery)
@Injectable()
export class GetPendingAdminQueriesHandler implements IQueryHandler<GetPendingAdminQueriesQuery> {
  constructor(
    @Inject('IConversationReadRepository')
    private readonly conversationReadRepo: IConversationReadRepository,
  ) {}

  async execute(query: GetPendingAdminQueriesQuery): Promise<ConversationReadModel[]> {
    return this.conversationReadRepo.findPendingByBusinessId(query.businessId);
  }
}

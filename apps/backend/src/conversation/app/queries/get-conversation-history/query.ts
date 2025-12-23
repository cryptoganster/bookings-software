import { Query } from '@nestjs/cqrs';
import { MessageReadModel } from '@conversation/domain/read-models/message';

/**
 * GetConversationHistoryQuery
 *
 * Query para obtener el historial completo de mensajes de una conversación.
 *
 * @remarks
 * - Extiende Query<TResult> para tipado fuerte del resultado
 * - Retorna array de MessageReadModel ordenados por sentAt ASC
 * - Usado en el panel de admin para mostrar conversación completa
 */
export class GetConversationHistoryQuery extends Query<MessageReadModel[]> {
  constructor(public readonly conversationId: string) {
    super();
  }
}

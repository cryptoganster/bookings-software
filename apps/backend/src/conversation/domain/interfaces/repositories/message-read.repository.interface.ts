import { MessageReadModel } from '@conversation/domain/read-models/message';

/**
 * IMessageReadRepository Interface
 *
 * Repositorio de lectura para mensajes.
 * Siguiendo CQRS estricto, solo contiene operaciones de lectura.
 *
 * @remarks
 * - Retorna MessageReadModel (DTOs), no aggregates
 * - Optimizado para queries de UI
 * - Puede incluir datos desnormalizados
 */
export interface IMessageReadRepository {
  /**
   * Obtiene todos los mensajes de una conversación
   *
   * @param conversationId - UUID de la conversación
   * @returns Array de MessageReadModel ordenados por sentAt ASC
   */
  findByConversationId(conversationId: string): Promise<MessageReadModel[]>;
}

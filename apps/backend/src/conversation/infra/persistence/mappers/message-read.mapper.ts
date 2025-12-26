import { MessageReadModel } from '@conversation/domain/read-models/message';

/**
 * MessageReadMapper
 *
 * Mapper para convertir resultados de base de datos a MessageReadModel.
 * Usado en el read repository para queries.
 *
 * @remarks
 * - Solo mapea de database result → read model (read side)
 * - Convierte Date a ISO 8601 string para API
 * - No incluye lógica de negocio
 */

interface RawMessageData {
  id: string;
  conversation_id?: string;
  conversationId?: string;
  direction: string;
  content: string;
  message_type?: string;
  messageType?: string;
  sent_at?: Date | string;
  sentAt?: Date | string;
  is_from_admin?: boolean;
  isFromAdmin?: boolean;
}

export class MessageReadMapper {
  /**
   * Convierte resultado de base de datos a MessageReadModel
   *
   * @param raw - Resultado raw de la query (puede ser MessageModel o raw query result)
   * @returns Read model para queries
   */
  static toReadModel(raw: RawMessageData): MessageReadModel {
    const direction = raw.direction as 'INBOUND' | 'OUTBOUND';
    const messageType = (raw.message_type || raw.messageType || 'TEXT') as
      | 'TEXT'
      | 'BUTTON'
      | 'LOCATION';

    return new MessageReadModel(
      raw.id,
      raw.conversation_id || raw.conversationId || '',
      direction,
      raw.content,
      messageType,
      raw.sent_at instanceof Date
        ? raw.sent_at.toISOString()
        : raw.sentAt instanceof Date
          ? raw.sentAt.toISOString()
          : raw.sent_at || raw.sentAt || '',
      raw.is_from_admin ?? raw.isFromAdmin ?? false,
    );
  }
}

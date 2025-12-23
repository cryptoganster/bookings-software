import { Message } from '@conversation/domain/aggregates/message';
import { MessageModel } from '@conversation/infra/persistence/models/message.model';

/**
 * MessageWriteMapper
 *
 * Mapper para convertir Message aggregate a MessageModel (TypeORM entity).
 * Usado en el write repository para persistencia.
 *
 * @remarks
 * - Solo mapea de aggregate → model (write side)
 * - No incluye lógica de negocio
 * - Convierte value objects a primitivos
 */
export class MessageWriteMapper {
  /**
   * Convierte Message aggregate a MessageModel
   *
   * @param message - Aggregate del dominio
   * @returns TypeORM entity para persistencia
   */
  static toModel(message: Message): MessageModel {
    const model = new MessageModel();

    model.id = message.getId().getValue();
    model.conversationId = message.getConversationId().getValue();
    model.direction = message.getDirection().getValue();
    model.content = message.getContent();
    model.messageType = message.getMessageType().getValue();
    model.sentAt = message.getSentAt();
    model.isFromAdmin = message.getIsFromAdmin();

    return model;
  }
}

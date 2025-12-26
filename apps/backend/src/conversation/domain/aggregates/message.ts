import { AggregateRoot } from '@nestjs/cqrs';
import { UUID } from '@shared/vo/uuid';
import { MessageDirection } from '@conversation/domain/vo/message-direction';
import { MessageType } from '@conversation/domain/vo/message-type';
import { MessageSent } from '@conversation/domain/events/message-sent';
import { EmptyMessageContentException } from '@conversation/domain/exceptions/empty-message-content.exception';

/**
 * Message Aggregate
 *
 * Representa un mensaje individual en una conversación.
 * Los mensajes son inmutables una vez creados.
 *
 * @remarks
 * - No usa VersionedAggregateRoot porque los mensajes no se modifican
 * - direction: INBOUND (del cliente) o OUTBOUND (al cliente)
 * - messageType: TEXT, BUTTON, LOCATION
 * - isFromAdmin: true si el mensaje fue enviado por un admin desde el panel
 */
export class Message extends AggregateRoot {
  private id!: UUID;
  private conversationId!: UUID;
  private direction!: MessageDirection;
  private content!: string;
  private messageType!: MessageType;
  private sentAt!: Date;
  private isFromAdmin!: boolean;

  /**
   * Factory method para crear un nuevo mensaje
   *
   * @param id - UUID del mensaje
   * @param conversationId - UUID de la conversación
   * @param direction - Dirección del mensaje (INBOUND/OUTBOUND)
   * @param content - Contenido del mensaje
   * @param messageType - Tipo de mensaje (TEXT/BUTTON/LOCATION)
   * @param isFromAdmin - Si el mensaje fue enviado por un admin
   * @returns Nueva instancia de Message
   * @throws EmptyMessageContentException si el contenido está vacío
   */
  static create(
    id: UUID,
    conversationId: UUID,
    direction: MessageDirection,
    content: string,
    messageType: MessageType,
    isFromAdmin: boolean = false,
  ): Message {
    // Validar que el contenido no esté vacío
    if (!content || content.trim().length === 0) {
      throw new EmptyMessageContentException();
    }

    const message = new Message();
    message.id = id;
    message.conversationId = conversationId;
    message.direction = direction;
    message.content = content.trim();
    message.messageType = messageType;
    message.sentAt = new Date();
    message.isFromAdmin = isFromAdmin;

    // Publicar evento de dominio
    message.apply(
      new MessageSent(id.getValue(), conversationId.getValue(), content.trim(), message.sentAt),
    );

    return message;
  }

  /**
   * Factory method para reconstruir desde persistencia
   *
   * @param id - UUID del mensaje
   * @param conversationId - UUID de la conversación
   * @param direction - Dirección del mensaje
   * @param content - Contenido del mensaje
   * @param messageType - Tipo de mensaje
   * @param sentAt - Fecha de envío
   * @param isFromAdmin - Si fue enviado por admin
   * @returns Instancia reconstruida de Message
   */
  static fromPersistence(
    id: UUID,
    conversationId: UUID,
    direction: MessageDirection,
    content: string,
    messageType: MessageType,
    sentAt: Date,
    isFromAdmin: boolean,
  ): Message {
    const message = new Message();
    message.id = id;
    message.conversationId = conversationId;
    message.direction = direction;
    message.content = content;
    message.messageType = messageType;
    message.sentAt = sentAt;
    message.isFromAdmin = isFromAdmin;
    return message;
  }

  // Getters
  getId(): UUID {
    return this.id;
  }

  getConversationId(): UUID {
    return this.conversationId;
  }

  getDirection(): MessageDirection {
    return this.direction;
  }

  getContent(): string {
    return this.content;
  }

  getMessageType(): MessageType {
    return this.messageType;
  }

  getSentAt(): Date {
    return this.sentAt;
  }

  getIsFromAdmin(): boolean {
    return this.isFromAdmin;
  }
}

/**
 * MessageSent Domain Event
 *
 * Evento publicado cuando un mensaje es enviado exitosamente.
 *
 * @remarks
 * - Usado para tracking, analytics, y sincronización
 * - No incluye direction ni messageType para mantener el evento simple
 * - Otros BCs pueden escuchar este evento si necesitan reaccionar
 */
export class MessageSent {
  constructor(
    public readonly messageId: string,
    public readonly conversationId: string,
    public readonly content: string,
    public readonly sentAt: Date,
    public readonly occurredAt: Date = new Date(),
  ) {}
}

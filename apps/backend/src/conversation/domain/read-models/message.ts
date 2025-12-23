/**
 * MessageReadModel
 *
 * Modelo de lectura para mensajes.
 * Usado en queries para mostrar el historial de conversación.
 *
 * @remarks
 * - Todos los campos son primitivos para fácil serialización
 * - direction: 'INBOUND' | 'OUTBOUND'
 * - messageType: 'TEXT' | 'BUTTON' | 'LOCATION'
 * - sentAt: ISO 8601 string para compatibilidad con frontend
 */
export class MessageReadModel {
  constructor(
    public readonly id: string,
    public readonly conversationId: string,
    public readonly direction: 'INBOUND' | 'OUTBOUND',
    public readonly content: string,
    public readonly messageType: 'TEXT' | 'BUTTON' | 'LOCATION',
    public readonly sentAt: string, // ISO 8601 string
    public readonly isFromAdmin: boolean,
  ) {}
}

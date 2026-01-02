import { Entity, Column, PrimaryColumn, CreateDateColumn, Index } from 'typeorm';

/**
 * MessageModel - TypeORM Entity
 *
 * Representa un mensaje en la base de datos.
 *
 * @remarks
 * - Mapea a la tabla 'messages'
 * - Relación con ConversationModel via conversationId (foreign key only, no bidirectional relation)
 * - direction: 'INBOUND' | 'OUTBOUND'
 * - messageType: 'TEXT' | 'BUTTON' | 'LOCATION'
 * - Indexes:
 *   - (conversation_id, sent_at): Para queries de historial de mensajes ordenados por fecha
 */
@Entity('messages')
@Index(['conversationId', 'sentAt'])
export class MessageModel {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'conversation_id' })
  conversationId!: string;

  @Column('varchar', { length: 10 })
  direction!: string;

  @Column('text')
  content!: string;

  @Column('varchar', { length: 20, name: 'message_type' })
  messageType!: string;

  @Column('timestamp', { name: 'sent_at' })
  sentAt!: Date;

  @Column('boolean', { name: 'is_from_admin', default: false })
  isFromAdmin!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}

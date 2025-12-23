import { Entity, Column, PrimaryColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ConversationModel } from '@conversation/infra/persistence/models/conversation.model';

/**
 * MessageModel - TypeORM Entity
 *
 * Representa un mensaje en la base de datos.
 *
 * @remarks
 * - Mapea a la tabla 'messages'
 * - Relación ManyToOne con ConversationModel
 * - direction: 'INBOUND' | 'OUTBOUND'
 * - messageType: 'TEXT' | 'BUTTON' | 'LOCATION'
 */
@Entity('messages')
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

  // Relación con Conversation
  @ManyToOne(() => ConversationModel, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conversation_id' })
  conversation?: ConversationModel;
}

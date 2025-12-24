import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

/**
 * ConversationModel - TypeORM Entity
 *
 * Representa una conversación en la base de datos.
 *
 * @remarks
 * - Mapea a la tabla 'conversations'
 * - Relación con MessageModel via conversationId (foreign key only, no bidirectional relation)
 * - status: 'ACTIVE' | 'AWAITING_ADMIN' | 'RESOLVED'
 * - version: Para optimistic locking
 */
@Entity('conversations')
export class ConversationModel {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'business_id' })
  businessId!: string;

  @Column('uuid', { name: 'customer_id' })
  customerId!: string;

  @Column('varchar', { length: 20, name: 'customer_phone' })
  customerPhone!: string;

  @Column('varchar', { length: 20 })
  status!: string;

  @Column('varchar', { length: 50 })
  state!: string;

  @Column('uuid', { name: 'selected_offering_id', nullable: true })
  selectedOfferingId?: string;

  @Column('date', { name: 'selected_date', nullable: true })
  selectedDate?: Date;

  @Column('time', { name: 'selected_time', nullable: true })
  selectedTime?: Date;

  @Column('uuid', { name: 'created_appointment_id', nullable: true })
  createdAppointmentId?: string;

  @Column('timestamp', { name: 'last_message_at', nullable: true })
  lastMessageAt?: Date;

  @Column('int', { default: 0 })
  version!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

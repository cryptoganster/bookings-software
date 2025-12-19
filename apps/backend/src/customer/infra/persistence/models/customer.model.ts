import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

/**
 * CustomerModel - TypeORM Entity
 *
 * Represents the customers table in the database
 * Multi-tenant: unique per (business_id, whatsapp_phone)
 *
 * @property {string} id - UUID primary key
 * @property {string | null} user_id - Optional link to User (null = anonymous, UUID = registered)
 * @property {string} business_id - Business this customer belongs to
 * @property {string} whatsapp_phone - WhatsApp phone in E.164 format
 * @property {string | null} name - Customer name (can be null initially)
 * @property {number} version - Optimistic locking version
 * @property {Date} created_at - Creation timestamp
 * @property {Date} updated_at - Last update timestamp
 */
@Entity('customers')
@Index(['business_id', 'whatsapp_phone'], { unique: true })
@Index(['business_id'])
@Index(['user_id'])
export class CustomerModel {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('uuid', { nullable: true })
  user_id!: string | null;

  @Column('uuid')
  business_id!: string;

  @Column('varchar', { length: 20 })
  whatsapp_phone!: string;

  @Column('varchar', { length: 255, nullable: true })
  name!: string | null;

  @Column('int', { default: 0 })
  version!: number;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}

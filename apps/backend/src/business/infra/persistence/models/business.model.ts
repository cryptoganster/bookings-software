import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

/**
 * BusinessModel - TypeORM Entity
 *
 * Persistence model for Business aggregate
 * Maps to 'businesses' table in database
 *
 * Requirements: 13.1-13.3
 */
@Entity('businesses')
@Index('idx_businesses_whatsapp_phone', ['whatsappPhone'], { unique: true })
@Index('idx_businesses_owner_id', ['ownerId'])
export class BusinessModel {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'owner_id' })
  ownerId!: string; // FK to users(id)

  @Column('varchar', { length: 100 })
  name!: string;

  @Column('varchar', { length: 20, name: 'whatsapp_phone', unique: true })
  whatsappPhone!: string;

  @Column('varchar', { length: 255, name: 'address_street' })
  addressStreet!: string;

  @Column('varchar', { length: 100, name: 'address_city' })
  addressCity!: string;

  @Column('varchar', { length: 100, name: 'address_state', nullable: true })
  addressState!: string | null;

  @Column('varchar', { length: 100, name: 'address_country', nullable: true })
  addressCountry!: string | null;

  @Column('varchar', { length: 20, name: 'address_postal_code', nullable: true })
  addressPostalCode!: string | null;

  @Column('varchar', { length: 50 })
  timezone!: string;

  @Column('boolean', { name: 'is_active', default: true })
  isActive!: boolean;

  @Column('integer', { default: 0 })
  version!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

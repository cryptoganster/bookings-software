import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('offerings')
@Index(['businessId'])
@Index(['isActive'])
@Index(['businessId', 'name'], { unique: true })
export class OfferingModel {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'business_id' })
  businessId!: string;

  @Column('varchar')
  name!: string;

  @Column('int')
  duration!: number;

  @Column('int', { name: 'max_capacity_per_slot' })
  maxCapacityPerSlot!: number;

  @Column('int', { nullable: true, name: 'max_daily_capacity' })
  maxDailyCapacity!: number | null;

  @Column('boolean', { name: 'is_active', default: true })
  isActive!: boolean;

  @Column('int', { default: 0 })
  version!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

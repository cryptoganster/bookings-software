import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('capacities')
@Index(['offeringId', 'date'], { unique: true })
export class CapacityModel {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'offering_id' })
  offeringId!: string;

  @Column('date')
  date!: Date;

  @Column('int', { name: 'total_slots' })
  totalSlots!: number;

  @Column('int', { name: 'available_slots' })
  availableSlots!: number;

  @Column('int', { default: 0 })
  version!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

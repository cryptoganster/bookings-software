import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('capacities')
@Index(['offeringId', 'date'], { unique: true })
export class CapacityModel {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('uuid')
  offeringId!: string;

  @Column('date')
  date!: Date;

  @Column('int')
  totalSlots!: number;

  @Column('int')
  availableSlots!: number;

  @Column('int', { default: 0 })
  version!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

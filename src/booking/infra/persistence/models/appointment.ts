import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('appointments')
@Index(['businessId'])
@Index(['customerId'])
export class AppointmentModel {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'business_id' })
  businessId!: string;

  @Column('uuid', { name: 'customer_id' })
  customerId!: string;

  @Column('uuid', { name: 'offering_id' })
  offeringId!: string;

  @Column('timestamp', { name: 'date_time' })
  dateTime!: Date;

  @Column('varchar')
  status!: string;

  @Column('int', { default: 0 })
  version!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @Column('timestamp', { nullable: true, name: 'cancelled_at' })
  cancelledAt!: Date | null;
}

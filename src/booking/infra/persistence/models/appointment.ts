import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('appointments')
@Index(['businessId'])
@Index(['customerId'])
export class AppointmentModel {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('uuid')
  businessId!: string;

  @Column('uuid')
  customerId!: string;

  @Column('uuid')
  offeringId!: string;

  @Column('timestamp')
  dateTime!: Date;

  @Column('varchar')
  status!: string;

  @Column('int', { default: 0 })
  version!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column('timestamp', { nullable: true })
  cancelledAt!: Date | null;
}

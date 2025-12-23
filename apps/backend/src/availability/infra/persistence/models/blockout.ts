import { Entity, PrimaryColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('blockouts')
@Index(['businessId', 'startDate', 'endDate'])
@Index(['businessId'])
export class BlockoutModel {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'business_id' })
  businessId!: string;

  @Column('timestamp', { name: 'start_date' })
  startDate!: Date;

  @Column('timestamp', { name: 'end_date' })
  endDate!: Date;

  @Column('text', { nullable: true })
  reason!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}

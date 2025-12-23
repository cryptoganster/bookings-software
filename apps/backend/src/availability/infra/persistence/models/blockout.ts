import { Entity, PrimaryColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('blockouts')
@Index(['businessId', 'startDate', 'endDate'])
@Index(['businessId'])
export class BlockoutModel {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('uuid')
  businessId!: string;

  @Column('timestamp')
  startDate!: Date;

  @Column('timestamp')
  endDate!: Date;

  @Column('text', { nullable: true })
  reason!: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}

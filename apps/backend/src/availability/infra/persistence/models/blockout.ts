import { Entity, PrimaryColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('blockouts')
@Index(['businessId', 'startDate', 'endDate'])
@Index(['businessId'])
export class BlockoutModel {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('uuid')
  businessId!: string;

  @Column('date')
  startDate!: Date;

  @Column('date')
  endDate!: Date;

  @Column('text', { nullable: true })
  reason!: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}

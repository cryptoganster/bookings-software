import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('schedules')
@Index(['businessId', 'dayOfWeek'], { unique: true })
@Index(['businessId'])
export class ScheduleModel {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('uuid')
  businessId!: string;

  @Column('int')
  dayOfWeek!: number; // 0-6 (Sunday-Saturday)

  @Column('time')
  startTime!: string; // HH:mm format

  @Column('time')
  endTime!: string; // HH:mm format

  @Column('boolean', { default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

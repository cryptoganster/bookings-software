import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('schedules')
@Index(['businessId', 'dayOfWeek'], { unique: true })
@Index(['businessId'])
export class ScheduleModel {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'business_id' })
  businessId!: string;

  @Column('int', { name: 'day_of_week' })
  dayOfWeek!: number; // 0-6 (Sunday-Saturday)

  @Column('time', { name: 'start_time' })
  startTime!: string; // HH:mm format

  @Column('time', { name: 'end_time' })
  endTime!: string; // HH:mm format

  @Column('boolean', { name: 'is_active', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

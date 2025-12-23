import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('business_owners')
export class BusinessOwnerModel {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'user_id' })
  @Index('idx_business_owners_user_id', { unique: true })
  userId!: string;

  @Column('varchar', { length: 50, name: 'subscription_plan' })
  subscriptionPlan!: string;

  @Column('varchar', { length: 50, name: 'subscription_status' })
  subscriptionStatus!: string;

  @Column('boolean', { default: false, name: 'onboarding_completed' })
  onboardingCompleted!: boolean;

  @Column('int', { default: 0 })
  version!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

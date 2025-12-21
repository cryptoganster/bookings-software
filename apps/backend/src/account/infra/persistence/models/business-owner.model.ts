import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('business_owners')
export class BusinessOwnerModel {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('uuid')
  @Index('idx_business_owners_user_id', { unique: true })
  userId!: string;

  @Column('varchar', { length: 50 })
  subscriptionPlan!: string;

  @Column('varchar', { length: 50 })
  subscriptionStatus!: string;

  @Column('boolean', { default: false })
  onboardingCompleted!: boolean;

  @Column('int', { default: 0 })
  version!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

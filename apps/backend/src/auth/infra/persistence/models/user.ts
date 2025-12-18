import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('users')
export class UserModel {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('varchar', { unique: true })
  email!: string;

  @Column('varchar')
  password!: string;

  @Column('varchar')
  name!: string;

  @Column('simple-array')
  roles!: string[];

  @Column('boolean', { name: 'is_active', default: true })
  isActive!: boolean;

  @Column('boolean', { name: 'email_verified', default: false })
  emailVerified!: boolean;

  @Column('int', { default: 0 })
  version!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}

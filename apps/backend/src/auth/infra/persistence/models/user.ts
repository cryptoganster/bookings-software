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

  @Column('uuid', { nullable: true })
  businessId!: string | null;

  @Column('int', { default: 0 })
  version!: number;

  @CreateDateColumn()
  createdAt!: Date;
}

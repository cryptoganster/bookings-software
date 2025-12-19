import { UserRole } from '@auth/domain/vo/user-role';

export class UserReadModel {
  id!: string;
  email!: string;
  name!: string;
  roles!: UserRole[];
  isActive!: boolean;
  emailVerified!: boolean;
  createdAt!: Date;
}

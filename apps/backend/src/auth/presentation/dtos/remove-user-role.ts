import { IsEnum, IsNotEmpty } from 'class-validator';
import { UserRole } from '@auth/domain/vo/user-role';

export class RemoveUserRoleDto {
  @IsEnum(UserRole)
  @IsNotEmpty()
  role!: UserRole;
}

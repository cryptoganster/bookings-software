import { IsEnum, IsNotEmpty } from 'class-validator';
import { UserRole } from '../../domain/vo/user-role';

export class RemoveUserRoleDto {
  @IsEnum(UserRole)
  @IsNotEmpty()
  role!: UserRole;
}

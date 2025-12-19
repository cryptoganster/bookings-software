import { Command } from '@nestjs/cqrs';
import { UserRole } from '@auth/domain/vo/user-role';

export class RemoveUserRoleCommand extends Command<void> {
  constructor(
    public readonly userId: string,
    public readonly role: UserRole,
  ) {
    super();
  }
}

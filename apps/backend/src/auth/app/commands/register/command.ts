import { Command } from '@nestjs/cqrs';
import { UserRole } from '@auth/domain/vo/user-role';

export class RegisterCommand extends Command<{ userId: string; accessToken: string }> {
  constructor(
    public readonly email: string,
    public readonly password: string,
    public readonly name: string,
    public readonly initialRole: UserRole,
  ) {
    super();
  }
}

import { Command } from '@nestjs/cqrs';

export class LoginCommand extends Command<{ accessToken: string }> {
  constructor(
    public readonly email: string,
    public readonly password: string,
  ) {
    super();
  }
}

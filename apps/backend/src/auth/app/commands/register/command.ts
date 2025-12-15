import { Command } from '@nestjs/cqrs';

export class RegisterCommand extends Command<{ userId: string; accessToken: string }> {
  constructor(
    public readonly email: string,
    public readonly password: string,
    public readonly name: string,
  ) {
    super();
  }
}

import { Command } from '@nestjs/cqrs';
import type { LoginResponseDto } from '@packages/shared-types';

export class LoginCommand extends Command<LoginResponseDto> {
  constructor(
    public readonly email: string,
    public readonly password: string,
  ) {
    super();
  }
}

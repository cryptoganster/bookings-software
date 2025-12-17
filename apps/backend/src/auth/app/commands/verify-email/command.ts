import { Command } from '@nestjs/cqrs';

export class VerifyEmailCommand extends Command<void> {
  constructor(public readonly userId: string) {
    super();
  }
}

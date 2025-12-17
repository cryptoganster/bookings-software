import { Command } from '@nestjs/cqrs';

export class DeactivateUserCommand extends Command<void> {
  constructor(public readonly userId: string) {
    super();
  }
}

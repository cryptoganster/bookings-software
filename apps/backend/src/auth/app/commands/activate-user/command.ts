import { Command } from '@nestjs/cqrs';

export class ActivateUserCommand extends Command<void> {
  constructor(public readonly userId: string) {
    super();
  }
}

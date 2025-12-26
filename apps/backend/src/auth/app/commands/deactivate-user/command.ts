import { Command } from '@shared/kernel';

export class DeactivateUserCommand extends Command<void> {
  constructor(public readonly userId: string) {
    super();
  }
}

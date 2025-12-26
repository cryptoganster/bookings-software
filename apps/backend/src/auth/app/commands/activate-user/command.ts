import { Command } from '@shared/kernel';

export class ActivateUserCommand extends Command<void> {
  constructor(public readonly userId: string) {
    super();
  }
}

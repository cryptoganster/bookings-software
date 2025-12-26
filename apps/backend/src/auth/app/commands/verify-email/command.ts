import { Command } from '@shared/kernel';

export class VerifyEmailCommand extends Command<void> {
  constructor(public readonly userId: string) {
    super();
  }
}

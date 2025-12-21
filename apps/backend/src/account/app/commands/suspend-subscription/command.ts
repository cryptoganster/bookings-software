import { Command } from '@nestjs/cqrs';

/**
 * SuspendSubscriptionCommand
 *
 * Command to suspend a BusinessOwner's subscription.
 *
 * Requirements: 5.1-5.3
 */
export class SuspendSubscriptionCommand extends Command<void> {
  constructor(public readonly businessOwnerId: string) {
    super();
  }
}

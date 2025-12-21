import { Command } from '@nestjs/cqrs';

/**
 * RestoreSubscriptionCommand
 *
 * Command to restore a suspended BusinessOwner's subscription.
 *
 * Requirements: 5.4-5.5
 */
export class RestoreSubscriptionCommand extends Command<void> {
  constructor(public readonly businessOwnerId: string) {
    super();
  }
}

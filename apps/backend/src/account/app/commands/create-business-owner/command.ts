import { Command } from '@shared/kernel';

/**
 * CreateBusinessOwnerCommand
 *
 * Command to create a new BusinessOwner profile.
 *
 * This command is typically dispatched by OnUserRegisteredHandler
 * when a User registers with role=BUSINESS_OWNER.
 *
 * Requirements: 1.1-1.5, 9.1
 */
export class CreateBusinessOwnerCommand extends Command<{ businessOwnerId: string }> {
  constructor(
    public readonly userId: string,
    public readonly subscriptionPlanName: string, // 'FREE', 'BASIC', 'PRO', 'ENTERPRISE'
  ) {
    super();
  }
}

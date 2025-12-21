import { Command } from '@nestjs/cqrs';

/**
 * UpgradeSubscriptionCommand
 *
 * Command to upgrade a BusinessOwner's subscription plan.
 *
 * Requirements: 4.1-4.5, 9.3
 */
export class UpgradeSubscriptionCommand extends Command<void> {
  constructor(
    public readonly businessOwnerId: string,
    public readonly newPlanName: string, // 'FREE', 'BASIC', 'PRO', 'ENTERPRISE'
  ) {
    super();
  }
}

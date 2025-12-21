import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { UpgradeSubscriptionCommand } from '@account/app/commands/upgrade-subscription/command';
import { IBusinessOwnerWriteRepository } from '@account/domain/interfaces/repositories/business-owner-write.interface';
import { IBusinessOwnerFactory } from '@account/domain/interfaces/factories/business-owner-factory.interface';
import { SubscriptionPlan } from '@account/domain/vo/subscription-plan';
import { BusinessOwnerNotFoundException } from '@account/domain/exceptions/business-owner-not-found.exception';

/**
 * UpgradeSubscriptionHandler
 *
 * Handles upgrading a BusinessOwner's subscription plan.
 *
 * Flow:
 * 1. Load BusinessOwner via Factory
 * 2. Parse new subscription plan
 * 3. Call upgradeSubscription() (validates upgrade is allowed)
 * 4. Persist changes
 *
 * Validations:
 * - New plan must be higher tier than current plan
 * - Cannot "upgrade" to same plan
 *
 * Requirements: 4.1-4.5, 9.3
 */
@CommandHandler(UpgradeSubscriptionCommand)
export class UpgradeSubscriptionHandler implements ICommandHandler<UpgradeSubscriptionCommand> {
  constructor(
    @Inject('IBusinessOwnerFactory')
    private readonly factory: IBusinessOwnerFactory,
    @Inject('IBusinessOwnerWriteRepository')
    private readonly writeRepository: IBusinessOwnerWriteRepository,
  ) {}

  async execute(command: UpgradeSubscriptionCommand): Promise<void> {
    // Load BusinessOwner
    const businessOwner = await this.factory.loadById(command.businessOwnerId);

    if (!businessOwner) {
      throw new BusinessOwnerNotFoundException(command.businessOwnerId);
    }

    // Parse new subscription plan
    const newPlan = this.parseSubscriptionPlan(command.newPlanName);

    // Upgrade subscription (validates upgrade is allowed)
    businessOwner.upgradeSubscription(newPlan);

    // Persist
    await this.writeRepository.save(businessOwner);
  }

  private parseSubscriptionPlan(planName: string): SubscriptionPlan {
    switch (planName.toUpperCase()) {
      case 'FREE':
        return SubscriptionPlan.free();
      case 'BASIC':
        return SubscriptionPlan.basic();
      case 'PRO':
        return SubscriptionPlan.pro();
      case 'ENTERPRISE':
        return SubscriptionPlan.enterprise();
      default:
        throw new Error(`Invalid subscription plan: ${planName}`);
    }
  }
}

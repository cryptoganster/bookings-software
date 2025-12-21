import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { CreateBusinessOwnerCommand } from '@account/app/commands/create-business-owner/command';
import { IBusinessOwnerWriteRepository } from '@account/domain/interfaces/repositories/business-owner-write.interface';
import { IBusinessOwnerFactory } from '@account/domain/interfaces/factories/business-owner-factory.interface';
import { BusinessOwner } from '@account/domain/aggregates/business-owner';
import { SubscriptionPlan } from '@account/domain/vo/subscription-plan';
import { UUID } from '@shared/vo/uuid';
import { BusinessOwnerAlreadyExistsException } from '@account/domain/exceptions/business-owner-already-exists.exception';

/**
 * CreateBusinessOwnerHandler
 *
 * Handles the creation of a new BusinessOwner profile.
 *
 * Flow:
 * 1. Validate that BusinessOwner doesn't already exist for this userId
 * 2. Create BusinessOwner aggregate with specified subscription plan
 * 3. Persist to database
 * 4. Return businessOwnerId
 *
 * Requirements: 1.1-1.5, 9.1
 */
@CommandHandler(CreateBusinessOwnerCommand)
export class CreateBusinessOwnerHandler implements ICommandHandler<CreateBusinessOwnerCommand> {
  constructor(
    @Inject('IBusinessOwnerWriteRepository')
    private readonly writeRepository: IBusinessOwnerWriteRepository,
    @Inject('IBusinessOwnerFactory')
    private readonly factory: IBusinessOwnerFactory,
  ) {}

  async execute(command: CreateBusinessOwnerCommand): Promise<{ businessOwnerId: string }> {
    // Validate that BusinessOwner doesn't already exist
    const existingOwner = await this.factory.loadByUserId(command.userId);

    if (existingOwner) {
      throw new BusinessOwnerAlreadyExistsException(command.userId);
    }

    // Parse subscription plan
    const subscriptionPlan = this.parseSubscriptionPlan(command.subscriptionPlanName);

    // Create BusinessOwner aggregate
    const businessOwnerId = UUID.generate();
    const userId = UUID.fromString(command.userId);

    const businessOwner = BusinessOwner.create(businessOwnerId, userId, subscriptionPlan);

    // Persist
    await this.writeRepository.save(businessOwner);

    return { businessOwnerId: businessOwnerId.getValue() };
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
        return SubscriptionPlan.free(); // Default to FREE if invalid
    }
  }
}

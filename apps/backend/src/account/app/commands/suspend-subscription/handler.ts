import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { SuspendSubscriptionCommand } from '@account/app/commands/suspend-subscription/command';
import { IBusinessOwnerWriteRepository } from '@account/domain/interfaces/repositories/business-owner-write.interface';
import { IBusinessOwnerFactory } from '@account/domain/interfaces/factories/business-owner-factory.interface';
import { BusinessOwnerNotFoundException } from '@account/domain/exceptions/business-owner-not-found.exception';

/**
 * SuspendSubscriptionHandler
 *
 * Handles suspending a BusinessOwner's subscription.
 *
 * Flow:
 * 1. Load BusinessOwner via Factory
 * 2. Call suspendSubscription()
 * 3. Persist changes
 *
 * Requirements: 5.1-5.3
 */
@CommandHandler(SuspendSubscriptionCommand)
export class SuspendSubscriptionHandler implements ICommandHandler<SuspendSubscriptionCommand> {
  constructor(
    @Inject('IBusinessOwnerFactory')
    private readonly factory: IBusinessOwnerFactory,
    @Inject('IBusinessOwnerWriteRepository')
    private readonly writeRepository: IBusinessOwnerWriteRepository,
  ) {}

  async execute(command: SuspendSubscriptionCommand): Promise<void> {
    // Load BusinessOwner
    const businessOwner = await this.factory.loadById(command.businessOwnerId);

    if (!businessOwner) {
      throw new BusinessOwnerNotFoundException(command.businessOwnerId);
    }

    // Suspend subscription
    businessOwner.suspendSubscription();

    // Persist
    await this.writeRepository.save(businessOwner);
  }
}

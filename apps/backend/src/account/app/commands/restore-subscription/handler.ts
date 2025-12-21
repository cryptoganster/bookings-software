import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { RestoreSubscriptionCommand } from '@account/app/commands/restore-subscription/command';
import { IBusinessOwnerWriteRepository } from '@account/domain/interfaces/repositories/business-owner-write.interface';
import { IBusinessOwnerFactory } from '@account/domain/interfaces/factories/business-owner-factory.interface';
import { BusinessOwnerNotFoundException } from '@account/domain/exceptions/business-owner-not-found.exception';

/**
 * RestoreSubscriptionHandler
 *
 * Handles restoring a suspended BusinessOwner's subscription.
 *
 * Flow:
 * 1. Load BusinessOwner via Factory
 * 2. Call restoreSubscription()
 * 3. Persist changes
 *
 * Requirements: 5.4-5.5
 */
@CommandHandler(RestoreSubscriptionCommand)
export class RestoreSubscriptionHandler implements ICommandHandler<RestoreSubscriptionCommand> {
  constructor(
    @Inject('IBusinessOwnerFactory')
    private readonly factory: IBusinessOwnerFactory,
    @Inject('IBusinessOwnerWriteRepository')
    private readonly writeRepository: IBusinessOwnerWriteRepository,
  ) {}

  async execute(command: RestoreSubscriptionCommand): Promise<void> {
    // Load BusinessOwner
    const businessOwner = await this.factory.loadById(command.businessOwnerId);

    if (!businessOwner) {
      throw new BusinessOwnerNotFoundException(command.businessOwnerId);
    }

    // Restore subscription
    businessOwner.restoreSubscription();

    // Persist
    await this.writeRepository.save(businessOwner);
  }
}

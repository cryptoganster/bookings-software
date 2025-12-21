import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { CompleteOnboardingCommand } from '@account/app/commands/complete-onboarding/command';
import { IBusinessOwnerWriteRepository } from '@account/domain/interfaces/repositories/business-owner-write.interface';
import { IBusinessOwnerFactory } from '@account/domain/interfaces/factories/business-owner-factory.interface';
import { BusinessOwnerNotFoundException } from '@account/domain/exceptions/business-owner-not-found.exception';

/**
 * CompleteOnboardingHandler
 *
 * Handles marking a BusinessOwner's onboarding as completed.
 *
 * Flow:
 * 1. Load BusinessOwner via Factory
 * 2. Call completeOnboarding() (validates not already completed)
 * 3. Persist changes
 *
 * Requirements: 3.1-3.5, 9.2
 */
@CommandHandler(CompleteOnboardingCommand)
export class CompleteOnboardingHandler implements ICommandHandler<CompleteOnboardingCommand> {
  constructor(
    @Inject('IBusinessOwnerFactory')
    private readonly factory: IBusinessOwnerFactory,
    @Inject('IBusinessOwnerWriteRepository')
    private readonly writeRepository: IBusinessOwnerWriteRepository,
  ) {}

  async execute(command: CompleteOnboardingCommand): Promise<void> {
    // Load BusinessOwner
    const businessOwner = await this.factory.loadById(command.businessOwnerId);

    if (!businessOwner) {
      throw new BusinessOwnerNotFoundException(command.businessOwnerId);
    }

    // Complete onboarding (validates not already completed)
    businessOwner.completeOnboarding();

    // Persist
    await this.writeRepository.save(businessOwner);
  }
}

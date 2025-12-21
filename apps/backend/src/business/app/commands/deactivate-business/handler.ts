import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { DeactivateBusinessCommand } from '@business/app/commands/deactivate-business/command';
import { IBusinessFactory } from '@business/domain/interfaces/factories/business-factory';
import { IBusinessWriteRepository } from '@business/domain/interfaces/repositories/business-write';
import { BusinessNotFoundException } from '@business/domain/exceptions/business-not-found';

/**
 * DeactivateBusinessHandler
 *
 * Handles deactivating a business.
 *
 * Requirements: 6.1, 6.3
 */
@CommandHandler(DeactivateBusinessCommand)
export class DeactivateBusinessHandler implements ICommandHandler<DeactivateBusinessCommand> {
  constructor(
    @Inject('IBusinessFactory')
    private readonly factory: IBusinessFactory,
    @Inject('IBusinessWriteRepository')
    private readonly writeRepository: IBusinessWriteRepository,
  ) {}

  async execute(command: DeactivateBusinessCommand): Promise<void> {
    // Load business
    const business = await this.factory.loadById(command.businessId);

    if (!business) {
      throw new BusinessNotFoundException(command.businessId);
    }

    // Deactivate (idempotent)
    business.deactivate();

    // Persist
    await this.writeRepository.save(business);
  }
}

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ActivateBusinessCommand } from '@business/app/commands/activate-business/command';
import { IBusinessFactory } from '@business/domain/interfaces/factories/business-factory';
import { IBusinessWriteRepository } from '@business/domain/interfaces/repositories/business-write';
import { BusinessNotFoundException } from '@business/domain/exceptions/business-not-found';

/**
 * ActivateBusinessHandler
 *
 * Handles activating a business.
 *
 * Requirements: 6.4, 6.5
 */
@CommandHandler(ActivateBusinessCommand)
export class ActivateBusinessHandler implements ICommandHandler<ActivateBusinessCommand> {
  constructor(
    @Inject('IBusinessFactory')
    private readonly factory: IBusinessFactory,
    @Inject('IBusinessWriteRepository')
    private readonly writeRepository: IBusinessWriteRepository,
  ) {}

  async execute(command: ActivateBusinessCommand): Promise<void> {
    // Load business
    const business = await this.factory.loadById(command.businessId);

    if (!business) {
      throw new BusinessNotFoundException(command.businessId);
    }

    // Activate (idempotent)
    business.activate();

    // Persist
    await this.writeRepository.save(business);
  }
}

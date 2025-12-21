import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { UpdateBusinessInfoCommand } from '@business/app/commands/update-business-info/command';
import { IBusinessFactory } from '@business/domain/interfaces/factories/business-factory';
import { IBusinessWriteRepository } from '@business/domain/interfaces/repositories/business-write';
import { BusinessAddress } from '@business/domain/vo/business-address';
import { Timezone } from '@business/domain/vo/timezone';
import { BusinessNotFoundException } from '@business/domain/exceptions/business-not-found';

/**
 * UpdateBusinessInfoHandler
 *
 * Handles updating business information.
 *
 * Requirements: 10.2
 */
@CommandHandler(UpdateBusinessInfoCommand)
export class UpdateBusinessInfoHandler implements ICommandHandler<UpdateBusinessInfoCommand> {
  constructor(
    @Inject('IBusinessFactory')
    private readonly factory: IBusinessFactory,
    @Inject('IBusinessWriteRepository')
    private readonly writeRepository: IBusinessWriteRepository,
  ) {}

  async execute(command: UpdateBusinessInfoCommand): Promise<void> {
    // Load business
    const business = await this.factory.loadById(command.businessId);

    if (!business) {
      throw new BusinessNotFoundException(command.businessId);
    }

    // Update info
    const address = BusinessAddress.create(
      command.address.street,
      command.address.city,
      command.address.state,
      command.address.country,
      command.address.postalCode,
    );
    const timezone = Timezone.create(command.timezone);

    business.updateInfo(command.name, address, timezone);

    // Persist
    await this.writeRepository.save(business);
  }
}

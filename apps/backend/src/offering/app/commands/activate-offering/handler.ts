import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ActivateOfferingCommand } from '@offering/app/commands/activate-offering/command';
import { IOfferingWriteRepository } from '@offering/domain/interfaces/repositories/offering-write';
import { IOfferingFactory } from '@offering/domain/interfaces/factories/offering-factory';
import { OfferingNotFoundException } from '@offering/domain/exceptions/offering-not-found';
import { OfferingNotFoundForBusinessException } from '@offering/domain/exceptions/offering-not-found-for-business';

@CommandHandler(ActivateOfferingCommand)
export class ActivateOfferingHandler implements ICommandHandler<ActivateOfferingCommand> {
  constructor(
    @Inject('IOfferingWriteRepository')
    private readonly writeRepository: IOfferingWriteRepository,
    @Inject('IOfferingFactory')
    private readonly factory: IOfferingFactory,
  ) {}

  async execute(command: ActivateOfferingCommand): Promise<void> {
    // Cargar aggregate
    const offering = await this.factory.loadById(command.offeringId);

    if (!offering) {
      throw new OfferingNotFoundException(command.offeringId);
    }

    // Validar que el offering pertenece al negocio
    if (offering.getBusinessId().getValue() !== command.businessId) {
      throw new OfferingNotFoundForBusinessException(command.offeringId, command.businessId);
    }

    // Activar
    offering.activate();

    // Persistir
    await this.writeRepository.save(offering);
  }
}

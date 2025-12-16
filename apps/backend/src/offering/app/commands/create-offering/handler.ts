import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { CreateOfferingCommand } from './command';
import { IOfferingWriteRepository } from '@offering/domain/interfaces/repositories/offering-write';
import { IOfferingFactory } from '@offering/domain/interfaces/factories/offering-factory';
import { Offering } from '@offering/domain/aggregates/offering';
import { UUID } from '@shared/vo/uuid';
import { OfferingDuration } from '@offering/domain/vo/offering-duration';
import { DuplicateOfferingNameException } from '@offering/domain/exceptions/duplicate-offering-name';

@CommandHandler(CreateOfferingCommand)
export class CreateOfferingHandler implements ICommandHandler<CreateOfferingCommand> {
  constructor(
    @Inject('IOfferingWriteRepository')
    private readonly writeRepository: IOfferingWriteRepository,
    @Inject('IOfferingFactory')
    private readonly factory: IOfferingFactory,
  ) {}

  async execute(command: CreateOfferingCommand): Promise<{ offeringId: string }> {
    // Validar que no exista un offering con el mismo nombre para este negocio
    const existingOffering = await this.factory.loadByBusinessIdAndName(
      command.businessId,
      command.name,
    );

    if (existingOffering) {
      throw new DuplicateOfferingNameException(command.businessId, command.name);
    }

    // Crear aggregate
    const offeringId = UUID.generate();
    const businessId = UUID.fromString(command.businessId);
    const duration = OfferingDuration.fromMinutes(command.durationMinutes);

    const offering = Offering.create(
      offeringId,
      businessId,
      command.name,
      duration,
      command.maxCapacityPerSlot,
      command.maxDailyCapacity,
    );

    // Persistir
    await this.writeRepository.save(offering);

    return { offeringId: offeringId.getValue() };
  }
}

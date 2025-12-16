import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { UpdateOfferingCommand } from './command';
import { IOfferingWriteRepository } from '@offering/domain/interfaces/repositories/offering-write';
import { IOfferingFactory } from '@offering/domain/interfaces/factories/offering-factory';
import { OfferingDuration } from '@offering/domain/vo/offering-duration';
import { OfferingNotFoundException } from '@offering/domain/exceptions/offering-not-found';
import { OfferingNotFoundForBusinessException } from '@offering/domain/exceptions/offering-not-found-for-business';
import { DuplicateOfferingNameException } from '@offering/domain/exceptions/duplicate-offering-name';
import { ConcurrencyException } from '@shared/kernel/exceptions/concurrency';

@CommandHandler(UpdateOfferingCommand)
export class UpdateOfferingHandler implements ICommandHandler<UpdateOfferingCommand> {
  private readonly MAX_RETRIES = 3;

  constructor(
    @Inject('IOfferingWriteRepository')
    private readonly writeRepository: IOfferingWriteRepository,
    @Inject('IOfferingFactory')
    private readonly factory: IOfferingFactory,
  ) {}

  async execute(command: UpdateOfferingCommand): Promise<void> {
    let attempt = 0;

    while (attempt < this.MAX_RETRIES) {
      try {
        await this.executeUpdate(command);
        return; // Éxito
      } catch (error) {
        if (error instanceof ConcurrencyException) {
          attempt++;
          if (attempt >= this.MAX_RETRIES) {
            throw new Error(
              'Unable to update offering after multiple attempts. Please try again.',
            );
          }
          // Espera breve antes de reintentar (exponential backoff)
          await new Promise((resolve) => setTimeout(resolve, 100 * Math.pow(2, attempt)));
        } else {
          throw error; // Otros errores se propagan inmediatamente
        }
      }
    }
  }

  private async executeUpdate(command: UpdateOfferingCommand): Promise<void> {
    // Cargar aggregate existente
    const offering = await this.factory.loadById(command.offeringId);

    if (!offering) {
      throw new OfferingNotFoundException(command.offeringId);
    }

    // Validar que el offering pertenece al negocio
    if (offering.getBusinessId().getValue() !== command.businessId) {
      throw new OfferingNotFoundForBusinessException(command.offeringId, command.businessId);
    }

    // Validar nombre único (excluyendo el offering actual)
    const existingOffering = await this.factory.loadByBusinessIdAndName(
      command.businessId,
      command.name,
    );

    if (existingOffering && existingOffering.getId().getValue() !== command.offeringId) {
      throw new DuplicateOfferingNameException(command.businessId, command.name);
    }

    // Actualizar aggregate
    const duration = OfferingDuration.fromMinutes(command.durationMinutes);

    offering.update(
      command.name,
      duration,
      command.maxCapacityPerSlot,
      command.maxDailyCapacity,
    );

    // Persistir (puede lanzar ConcurrencyException)
    await this.writeRepository.save(offering);
  }
}

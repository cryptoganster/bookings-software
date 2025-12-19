import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { SetCapacityCommand } from '@availability/app/commands/set-capacity/command';
import { ICapacityFactory } from '@availability/domain/interfaces/factories/capacity-factory';
import { ICapacityWriteRepository } from '@availability/domain/interfaces/repositories/capacity-write';
import { IUnitOfWork } from '@shared/kernel/uow';
import { UUID } from '@shared/vo/uuid';
import { Capacity } from '@availability/domain/aggregates/capacity';

/**
 * Handler for SetCapacityCommand
 *
 * Creates new capacity or updates existing capacity for an offering on a specific date
 */
@CommandHandler(SetCapacityCommand)
export class SetCapacityHandler implements ICommandHandler<SetCapacityCommand> {
  constructor(
    @Inject('ICapacityFactory')
    private readonly capacityFactory: ICapacityFactory,
    @Inject('ICapacityWriteRepository')
    private readonly capacityWriteRepository: ICapacityWriteRepository,
    @Inject('IUnitOfWork')
    private readonly uow: IUnitOfWork,
  ) {}

  async execute(command: SetCapacityCommand): Promise<{ capacityId: string }> {
    return await this.uow.transaction(async () => {
      // Intentar cargar capacidad existente
      const existingCapacity = await this.capacityFactory.loadByOfferingAndDate(
        command.offeringId,
        command.date,
      );

      let capacity: Capacity;
      let capacityId: string;

      if (existingCapacity) {
        // Actualizar capacidad existente
        existingCapacity.updateCapacity(command.totalSlots);
        capacity = existingCapacity;
        capacityId = existingCapacity.getId().getValue();
      } else {
        // Crear nueva capacidad
        const newId = UUID.generate();
        capacity = Capacity.create(
          newId,
          UUID.fromString(command.offeringId),
          command.date,
          command.totalSlots,
        );
        capacityId = newId.getValue();
      }

      // Persistir
      await this.capacityWriteRepository.save(capacity);

      return { capacityId };
    });
  }
}

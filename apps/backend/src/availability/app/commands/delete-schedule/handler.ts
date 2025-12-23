import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { DeleteScheduleCommand } from '@availability/app/commands/delete-schedule/command';
import { IScheduleFactory } from '@availability/domain/interfaces/factories/schedule-factory';
import { IScheduleWriteRepository } from '@availability/domain/interfaces/repositories/schedule-write';
import { IUnitOfWork } from '@shared/kernel/uow';
import { ScheduleNotFoundException } from '@availability/domain/exceptions/schedule-not-found.exception';

/**
 * Handler for DeleteScheduleCommand
 *
 * Deactivates a schedule (soft delete).
 *
 * Requirements: 1.5
 */
@CommandHandler(DeleteScheduleCommand)
export class DeleteScheduleHandler implements ICommandHandler<DeleteScheduleCommand> {
  constructor(
    @Inject('IScheduleFactory')
    private readonly scheduleFactory: IScheduleFactory,
    @Inject('IScheduleWriteRepository')
    private readonly scheduleWriteRepository: IScheduleWriteRepository,
    @Inject('IUnitOfWork')
    private readonly uow: IUnitOfWork,
  ) {}

  async execute(command: DeleteScheduleCommand): Promise<void> {
    return await this.uow.transaction(async () => {
      // Cargar aggregate
      const schedule = await this.scheduleFactory.loadById(command.scheduleId);

      if (!schedule) {
        throw new ScheduleNotFoundException(command.scheduleId);
      }

      // Deactivar (soft delete)
      schedule.deactivate();

      // Persistir
      await this.scheduleWriteRepository.save(schedule);
    });
  }
}

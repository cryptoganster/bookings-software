import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { UpdateScheduleCommand } from '@availability/app/commands/update-schedule/command';
import { IScheduleFactory } from '@availability/domain/interfaces/factories/schedule-factory';
import { IScheduleWriteRepository } from '@availability/domain/interfaces/repositories/schedule-write';
import { IUnitOfWork } from '@shared/kernel/uow';
import { TimeSlot } from '@availability/domain/vo/time-slot.vo';
import { ScheduleNotFoundException } from '@availability/domain/exceptions/schedule-not-found.exception';

/**
 * Handler for UpdateScheduleCommand
 *
 * Updates an existing schedule's time slot.
 *
 * Requirements: 1.4
 */
@CommandHandler(UpdateScheduleCommand)
export class UpdateScheduleHandler implements ICommandHandler<UpdateScheduleCommand> {
  constructor(
    @Inject('IScheduleFactory')
    private readonly scheduleFactory: IScheduleFactory,
    @Inject('IScheduleWriteRepository')
    private readonly scheduleWriteRepository: IScheduleWriteRepository,
    @Inject('IUnitOfWork')
    private readonly uow: IUnitOfWork,
  ) {}

  async execute(command: UpdateScheduleCommand): Promise<void> {
    return await this.uow.transaction(async () => {
      // Cargar aggregate
      const schedule = await this.scheduleFactory.loadById(command.scheduleId);

      if (!schedule) {
        throw new ScheduleNotFoundException(command.scheduleId);
      }

      // Determinar nuevos valores (usar existentes si no se proporcionan)
      const currentTimeSlot = schedule.getTimeSlot();
      const startTime = command.startTime ?? currentTimeSlot.getStartTime();
      const endTime = command.endTime ?? currentTimeSlot.getEndTime();

      // Crear nuevo TimeSlot
      const newTimeSlot = TimeSlot.create(startTime, endTime);

      // Actualizar
      schedule.update(newTimeSlot);

      // Persistir
      await this.scheduleWriteRepository.save(schedule);
    });
  }
}

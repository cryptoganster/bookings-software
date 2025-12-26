import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { CreateScheduleCommand } from '@availability/app/commands/create-schedule/command';
import { IScheduleFactory } from '@availability/domain/interfaces/factories/schedule-factory';
import { IScheduleWriteRepository } from '@availability/domain/interfaces/repositories/schedule-write';
import { IUnitOfWork } from '@shared/kernel/uow';
import { UUID } from '@shared/vo/uuid';
import { Schedule } from '@availability/domain/aggregates/schedule';
import { DayOfWeek } from '@availability/domain/vo/day-of-week.vo';
import { TimeSlot } from '@availability/domain/vo/time-slot.vo';
import { ScheduleAlreadyExistsException } from '@availability/domain/exceptions/schedule-already-exists.exception';

/**
 * Handler for CreateScheduleCommand
 *
 * Creates a new schedule for a business defining operating hours for a specific day.
 *
 * Requirements: 1.1, 1.2, 1.3, 6.1
 */
@CommandHandler(CreateScheduleCommand)
export class CreateScheduleHandler implements ICommandHandler<CreateScheduleCommand> {
  constructor(
    @Inject('IScheduleFactory')
    private readonly scheduleFactory: IScheduleFactory,
    @Inject('IScheduleWriteRepository')
    private readonly scheduleWriteRepository: IScheduleWriteRepository,
    @Inject('IUnitOfWork')
    private readonly uow: IUnitOfWork,
  ) {}

  async execute(command: CreateScheduleCommand): Promise<{ scheduleId: string }> {
    return await this.uow.transaction(async () => {
      // Verificar que no exista un schedule para este business y día
      const existingSchedule = await this.scheduleFactory.loadByBusinessAndDay(
        command.businessId,
        command.dayOfWeek,
      );

      if (existingSchedule && existingSchedule.getIsActive()) {
        throw new ScheduleAlreadyExistsException(command.businessId, command.dayOfWeek);
      }

      // Crear value objects
      const dayOfWeek = DayOfWeek.create(command.dayOfWeek);
      const timeSlot = TimeSlot.create(command.startTime, command.endTime);

      // Crear aggregate
      const scheduleId = UUID.generate();
      const schedule = Schedule.create(
        scheduleId,
        UUID.fromString(command.businessId),
        dayOfWeek,
        timeSlot,
      );

      // Persistir
      await this.scheduleWriteRepository.save(schedule);

      return { scheduleId: scheduleId.getValue() };
    });
  }
}

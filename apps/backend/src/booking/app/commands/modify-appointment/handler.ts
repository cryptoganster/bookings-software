import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ModifyAppointmentCommand } from './command';
import { IAppointmentFactory } from '@booking/domain/interfaces/factories/appointment-factory';
import { IAppointmentWriteRepository } from '@booking/domain/interfaces/repositories/appointment-write';
import { DateTime } from '@booking/domain/vo/date-time';
import { AppointmentNotFoundException } from '@booking/domain/exceptions/appointment-not-found';
import { ConcurrencyException } from '@shared/kernel/exceptions/concurrency';

@CommandHandler(ModifyAppointmentCommand)
export class ModifyAppointmentHandler implements ICommandHandler<ModifyAppointmentCommand> {
  constructor(
    @Inject('IAppointmentFactory')
    private readonly appointmentFactory: IAppointmentFactory,
    @Inject('IAppointmentWriteRepository')
    private readonly appointmentRepository: IAppointmentWriteRepository,
  ) {}

  async execute(command: ModifyAppointmentCommand): Promise<void> {
    const maxRetries = 3;
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        // Load aggregate using factory (CQRS strict compliance)
        const appointment = await this.appointmentFactory.loadById(command.appointmentId);

        if (!appointment) {
          throw new AppointmentNotFoundException(command.appointmentId);
        }

        // Execute business logic
        appointment.modify(DateTime.fromDate(command.newDateTime));

        // Persist using write repository
        await this.appointmentRepository.save(appointment);

        return;
      } catch (error) {
        if (error instanceof ConcurrencyException) {
          attempt++;
          if (attempt >= maxRetries) {
            throw new Error('Unable to modify appointment after multiple attempts');
          }
          // Exponential backoff
          await new Promise((resolve) => setTimeout(resolve, 100 * Math.pow(2, attempt)));
        } else {
          throw error;
        }
      }
    }
  }
}

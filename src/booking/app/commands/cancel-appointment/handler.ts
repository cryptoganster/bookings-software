import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { CancelAppointmentCommand } from './command';
import { IAppointmentWriteRepository } from '../../../domain/interfaces/repositories/appointment-write.repository';
import { UUID } from '../../../../shared/vo/uuid';
import { AppointmentNotFoundException } from '../../../domain/exceptions/appointment-not-found';
import { ConcurrencyException } from '../../../../shared/kernel/exceptions/concurrency';

@CommandHandler(CancelAppointmentCommand)
export class CancelAppointmentHandler
  implements ICommandHandler<CancelAppointmentCommand>
{
  constructor(
    @Inject('IAppointmentWriteRepository')
    private readonly appointmentRepository: IAppointmentWriteRepository,
  ) {}

  async execute(command: CancelAppointmentCommand): Promise<void> {
    const maxRetries = 3;
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        const appointment = await this.appointmentRepository.findById(
          UUID.fromString(command.appointmentId),
        );

        if (!appointment) {
          throw new AppointmentNotFoundException(command.appointmentId);
        }

        appointment.cancel();
        await this.appointmentRepository.save(appointment);

        return;
      } catch (error) {
        if (error instanceof ConcurrencyException) {
          attempt++;
          if (attempt >= maxRetries) {
            throw new Error(
              'Unable to cancel appointment after multiple attempts',
            );
          }
          // Exponential backoff
          await new Promise((resolve) =>
            setTimeout(resolve, 100 * Math.pow(2, attempt)),
          );
        } else {
          throw error;
        }
      }
    }
  }
}

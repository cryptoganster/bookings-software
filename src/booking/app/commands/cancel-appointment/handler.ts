import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { CancelAppointmentCommand } from './command';
import { IAppointmentWriteRepository } from '@booking/domain/interfaces/repositories/appointment-write';
import { UUID } from '@shared/vo/uuid';
import { AppointmentNotFoundException } from '@booking/domain/exceptions/appointment-not-found';
import { ConcurrencyException } from '@shared/kernel/exceptions/concurrency';

@CommandHandler(CancelAppointmentCommand)
export class CancelAppointmentHandler implements ICommandHandler<CancelAppointmentCommand> {
  constructor(
    @Inject('IAppointmentWriteRepository')
    private readonly appointmentRepository: IAppointmentWriteRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(CancelAppointmentHandler.name);
  }

  async execute(command: CancelAppointmentCommand): Promise<void> {
    const startTime = Date.now();
    const maxRetries = 3;
    let attempt = 0;

    this.logger.info(
      {
        commandName: 'CancelAppointmentCommand',
        appointmentId: command.appointmentId,
        cancelledBy: command.cancelledBy,
        timestamp: new Date().toISOString(),
      },
      'Executing CancelAppointmentCommand',
    );

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

        const duration = Date.now() - startTime;
        this.logger.info(
          {
            commandName: 'CancelAppointmentCommand',
            appointmentId: command.appointmentId,
            attempts: attempt + 1,
            duration,
            timestamp: new Date().toISOString(),
          },
          'CancelAppointmentCommand executed successfully',
        );

        return;
      } catch (error) {
        if (error instanceof ConcurrencyException) {
          attempt++;
          this.logger.warn(
            {
              commandName: 'CancelAppointmentCommand',
              appointmentId: command.appointmentId,
              attempt,
              maxRetries,
              timestamp: new Date().toISOString(),
            },
            'ConcurrencyException detected, retrying',
          );

          if (attempt >= maxRetries) {
            const duration = Date.now() - startTime;
            this.logger.error(
              {
                commandName: 'CancelAppointmentCommand',
                appointmentId: command.appointmentId,
                attempts: attempt,
                duration,
                timestamp: new Date().toISOString(),
              },
              'Unable to cancel appointment after multiple attempts',
            );
            throw new Error('Unable to cancel appointment after multiple attempts');
          }
          // Exponential backoff
          await new Promise((resolve) => setTimeout(resolve, 100 * Math.pow(2, attempt)));
        } else {
          const duration = Date.now() - startTime;
          this.logger.error(
            {
              commandName: 'CancelAppointmentCommand',
              error: {
                message: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined,
                name: error instanceof Error ? error.name : 'Error',
              },
              appointmentId: command.appointmentId,
              duration,
              timestamp: new Date().toISOString(),
            },
            'CancelAppointmentCommand failed',
          );
          throw error;
        }
      }
    }
  }
}

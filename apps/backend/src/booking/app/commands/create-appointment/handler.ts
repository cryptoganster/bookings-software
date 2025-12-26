import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { CreateAppointmentCommand } from '@booking/app/commands/create-appointment/command';
import { IAppointmentWriteRepository } from '@booking/domain/interfaces/repositories/appointment-write';
import { ICapacityFactory } from '@availability/domain/interfaces/factories/capacity-factory';
import { ICapacityWriteRepository } from '@availability/domain/interfaces/repositories/capacity-write';
import { ICustomerExistenceChecker } from '@customer/domain/interfaces/services/customer-existence-checker.interface';
import { IUnitOfWork } from '@shared/kernel/uow';
import { Appointment } from '@booking/domain/aggregates/appointment';
import { UUID } from '@shared/vo/uuid';
import { DateTime } from '@booking/domain/vo/date-time';
import { NoAvailableSlotsException } from '@booking/domain/exceptions/no-available-slots';
import { CustomerNotFoundException } from '@customer/domain/exceptions/customer-not-found';

@CommandHandler(CreateAppointmentCommand)
export class CreateAppointmentHandler implements ICommandHandler<CreateAppointmentCommand> {
  constructor(
    @Inject('IAppointmentWriteRepository')
    private readonly appointmentRepository: IAppointmentWriteRepository,
    @Inject('ICapacityFactory')
    private readonly capacityFactory: ICapacityFactory,
    @Inject('ICapacityWriteRepository')
    private readonly capacityWriteRepository: ICapacityWriteRepository,
    @Inject('ICustomerExistenceChecker')
    private readonly customerExistenceChecker: ICustomerExistenceChecker,
    @Inject('IUnitOfWork')
    private readonly uow: IUnitOfWork,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(CreateAppointmentHandler.name);
  }

  async execute(command: CreateAppointmentCommand): Promise<{ appointmentId: string }> {
    const startTime = Date.now();
    const appointmentId = UUID.generate();

    this.logger.info(
      {
        commandName: 'CreateAppointmentCommand',
        businessId: command.businessId,
        customerId: command.customerId,
        offeringId: command.offeringId,
        dateTime: command.dateTime,
        timestamp: new Date().toISOString(),
      },
      'Executing CreateAppointmentCommand',
    );

    try {
      await this.uow.transaction(async () => {
        // Validate customer exists before creating appointment
        const customerExists = await this.customerExistenceChecker.exists(command.customerId);
        if (!customerExists) {
          throw new CustomerNotFoundException(command.customerId);
        }

        // Load capacity aggregate using factory (not repository)
        const capacity = await this.capacityFactory.loadByOfferingAndDate(
          command.offeringId,
          command.dateTime,
        );

        if (!capacity || !capacity.hasAvailableSlots()) {
          throw new NoAvailableSlotsException();
        }

        // Apply business logic
        capacity.bookSlot();

        // Persist using write repository (only save)
        await this.capacityWriteRepository.save(capacity);

        // Create appointment
        const appointment = Appointment.create(
          appointmentId,
          UUID.fromString(command.businessId),
          UUID.fromString(command.customerId),
          UUID.fromString(command.offeringId),
          DateTime.fromDate(command.dateTime),
        );

        await this.appointmentRepository.save(appointment);
      });

      const duration = Date.now() - startTime;
      this.logger.info(
        {
          commandName: 'CreateAppointmentCommand',
          appointmentId: appointmentId.getValue(),
          duration,
          timestamp: new Date().toISOString(),
        },
        'CreateAppointmentCommand executed successfully',
      );

      return { appointmentId: appointmentId.getValue() };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(
        {
          commandName: 'CreateAppointmentCommand',
          error: {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            name: error instanceof Error ? error.name : 'Error',
          },
          businessId: command.businessId,
          customerId: command.customerId,
          offeringId: command.offeringId,
          duration,
          timestamp: new Date().toISOString(),
        },
        'CreateAppointmentCommand failed',
      );
      throw error;
    }
  }
}

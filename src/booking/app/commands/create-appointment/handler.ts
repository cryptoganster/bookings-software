import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { CreateAppointmentCommand } from './command';
import { IAppointmentWriteRepository } from '@booking/domain/interfaces/repositories/appointment-write';
import { ICapacityFactory } from '@availability/domain/interfaces/factories/capacity-factory';
import { ICapacityWriteRepository } from '@availability/domain/interfaces/repositories/capacity-write';
import { IUnitOfWork } from '@shared/kernel/uow';
import { Appointment } from '@booking/domain/aggregates/appointment';
import { UUID } from '@shared/vo/uuid';
import { DateTime } from '@booking/domain/vo/date-time';
import { NoAvailableSlotsException } from '@booking/domain/exceptions/no-available-slots';

@CommandHandler(CreateAppointmentCommand)
export class CreateAppointmentHandler implements ICommandHandler<CreateAppointmentCommand> {
  constructor(
    @Inject('IAppointmentWriteRepository')
    private readonly appointmentRepository: IAppointmentWriteRepository,
    @Inject('ICapacityFactory')
    private readonly capacityFactory: ICapacityFactory,
    @Inject('ICapacityWriteRepository')
    private readonly capacityWriteRepository: ICapacityWriteRepository,
    @Inject('IUnitOfWork')
    private readonly uow: IUnitOfWork,
  ) {}

  async execute(command: CreateAppointmentCommand): Promise<{ appointmentId: string }> {
    const appointmentId = UUID.generate();

    await this.uow.transaction(async () => {
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

    return { appointmentId: appointmentId.getValue() };
  }
}

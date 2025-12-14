import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { CreateAppointmentCommand } from './command';
import { IAppointmentWriteRepository } from '@booking/domain/interfaces/repositories/appointment-write';
import { IUnitOfWork } from '@shared/kernel/uow';
import { Appointment } from '@booking/domain/aggregates/appointment';
import { UUID } from '@shared/vo/uuid';
import { DateTime } from '@booking/domain/vo/date-time';
import { NoAvailableSlotsException } from '@booking/domain/exceptions/no-available-slots';

// #TODO Change Later. Placeholder interface for Capacity repository (will be implemented later)
interface ICapacityWriteRepository {
  findByOfferingAndDate(offeringId: string, date: Date): Promise<any>;
  save(capacity: any): Promise<void>;
}

@CommandHandler(CreateAppointmentCommand)
export class CreateAppointmentHandler implements ICommandHandler<CreateAppointmentCommand> {
  constructor(
    @Inject('IAppointmentWriteRepository')
    private readonly appointmentRepository: IAppointmentWriteRepository,
    @Inject('ICapacityWriteRepository')
    private readonly capacityRepository: ICapacityWriteRepository,
    @Inject('IUnitOfWork')
    private readonly uow: IUnitOfWork,
  ) {}

  async execute(command: CreateAppointmentCommand): Promise<{ appointmentId: string }> {
    const appointmentId = UUID.generate();

    await this.uow.transaction(async () => {
      // Verificar y decrementar capacidad
      const capacity = await this.capacityRepository.findByOfferingAndDate(
        command.offeringId,
        command.dateTime,
      );

      if (!capacity || !capacity.hasAvailableSlots()) {
        throw new NoAvailableSlotsException();
      }

      capacity.decrementSlot();
      await this.capacityRepository.save(capacity);

      // Crear cita
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

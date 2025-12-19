import { VersionedAggregateRoot } from '@shared/kernel/versioned-aggregate-root';
import { UUID } from '@shared/vo/uuid';
import { AppointmentStatus } from '@booking/domain/vo/appointment-status';
import { DateTime } from '@booking/domain/vo/date-time';
import { AppointmentCreated } from '@booking/domain/events/appointment-created';
import { AppointmentCancelled } from '@booking/domain/events/appointment-cancelled';
import { AppointmentModified } from '@booking/domain/events/appointment-modified';

export class Appointment extends VersionedAggregateRoot {
  private id!: UUID;
  private businessId!: UUID;
  private customerId!: UUID;
  private offeringId!: UUID;
  private status!: AppointmentStatus;
  private dateTime!: DateTime;

  // Factory method para creación
  static create(
    id: UUID,
    businessId: UUID,
    customerId: UUID,
    offeringId: UUID,
    dateTime: DateTime,
  ): Appointment {
    // Validaciones
    if (dateTime.isInPast()) {
      throw new Error('Cannot create appointment in the past');
    }

    const appointment = new Appointment();
    appointment.id = id;
    appointment.businessId = businessId;
    appointment.customerId = customerId;
    appointment.offeringId = offeringId;
    appointment.dateTime = dateTime;
    appointment.status = AppointmentStatus.confirmed();

    // Publicar evento
    appointment.apply(
      new AppointmentCreated(
        id.getValue(),
        businessId.getValue(),
        customerId.getValue(),
        offeringId.getValue(),
        dateTime.toDate(),
      ),
    );
    appointment.incrementVersion();

    return appointment;
  }

  // Métodos de negocio
  cancel(): void {
    // Validar reglas de negocio
    if (!this.status.canBeCancelled()) {
      throw new Error('Appointment cannot be cancelled');
    }

    if (this.dateTime.isWithinHours(2)) {
      throw new Error('Cannot cancel appointment within 2 hours of scheduled time');
    }

    // Cambiar estado
    this.status = AppointmentStatus.cancelled();
    this.incrementVersion();

    // Publicar evento
    this.apply(new AppointmentCancelled(this.id.getValue()));
  }

  modify(newDateTime: DateTime): void {
    // Validaciones
    if (this.status.isCancelled()) {
      throw new Error('Cannot modify cancelled appointment');
    }

    if (newDateTime.isInPast()) {
      throw new Error('Cannot modify appointment to past date');
    }

    // Cambiar estado
    this.dateTime = newDateTime;
    this.incrementVersion();

    // Publicar evento
    this.apply(new AppointmentModified(this.id.getValue(), newDateTime.toDate()));
  }

  // Factory method para reconstrucción desde persistencia
  static fromPersistence(
    id: UUID,
    businessId: UUID,
    customerId: UUID,
    offeringId: UUID,
    dateTime: DateTime,
    status: AppointmentStatus,
    version: number,
  ): Appointment {
    const appointment = new Appointment();
    appointment.id = id;
    appointment.businessId = businessId;
    appointment.customerId = customerId;
    appointment.offeringId = offeringId;
    appointment.dateTime = dateTime;
    appointment.status = status;
    appointment.setVersion(version);
    return appointment;
  }

  // Getters (no setters públicos)
  getId(): UUID {
    return this.id;
  }

  getBusinessId(): UUID {
    return this.businessId;
  }

  getCustomerId(): UUID {
    return this.customerId;
  }

  getOfferingId(): UUID {
    return this.offeringId;
  }

  getDateTime(): DateTime {
    return this.dateTime;
  }

  getStatus(): AppointmentStatus {
    return this.status;
  }
}

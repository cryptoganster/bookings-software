import { Appointment } from '@booking/domain/aggregates/appointment';
import { AppointmentModel } from '@booking/infra/persistence/models/appointment';
import { UUID } from '@shared/vo/uuid';
import { DateTime } from '@booking/domain/vo/date-time';
import { AppointmentStatus } from '@booking/domain/vo/appointment-status';

export class AppointmentWriteMapper {
  static toModel(appointment: Appointment): Partial<AppointmentModel> {
    return {
      id: appointment.getId().getValue(),
      businessId: appointment.getBusinessId().getValue(),
      customerId: appointment.getCustomerId().getValue(),
      offeringId: appointment.getOfferingId().getValue(),
      dateTime: appointment.getDateTime().toDate(),
      status: appointment.getStatus().getValue(),
      version: appointment.getVersion().getValue(),
    };
  }

  static toDomain(model: AppointmentModel): Appointment {
    return Appointment.fromPersistence(
      UUID.fromString(model.id),
      UUID.fromString(model.businessId),
      UUID.fromString(model.customerId),
      UUID.fromString(model.offeringId),
      DateTime.fromDate(model.dateTime),
      AppointmentStatus.fromString(model.status),
      model.version,
    );
  }
}

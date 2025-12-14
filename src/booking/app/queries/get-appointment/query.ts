import { IQuery } from '@nestjs/cqrs';
import { AppointmentReadModel } from '@booking/domain/read-models/appointment';

export class GetAppointmentQuery implements IQuery {
  constructor(public readonly appointmentId: string) {}
}

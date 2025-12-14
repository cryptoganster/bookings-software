import { IQuery } from '@nestjs/cqrs';
import { AppointmentReadModel } from '@booking/domain/read-models/appointment';

export class GetCustomerAppointmentsQuery implements IQuery {
  constructor(public readonly customerId: string) {}
}

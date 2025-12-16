import { IQuery } from '@nestjs/cqrs';

export class GetAppointmentQuery implements IQuery {
  constructor(public readonly appointmentId: string) {}
}

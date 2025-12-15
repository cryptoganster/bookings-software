import { IQuery } from '@nestjs/cqrs';

export class GetCustomerAppointmentsQuery implements IQuery {
  constructor(public readonly customerId: string) {}
}

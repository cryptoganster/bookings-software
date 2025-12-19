import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetCustomerAppointmentsQuery } from '@booking/app/queries/get-customer-appointments/query';
import { AppointmentReadModel } from '@booking/domain/read-models/appointment';
import { IAppointmentReadRepository } from '@booking/domain/interfaces/repositories/appointment-read';

@QueryHandler(GetCustomerAppointmentsQuery)
export class GetCustomerAppointmentsHandler implements IQueryHandler<GetCustomerAppointmentsQuery> {
  constructor(
    @Inject('IAppointmentReadRepository')
    private readonly appointmentReadRepository: IAppointmentReadRepository,
  ) {}

  async execute(query: GetCustomerAppointmentsQuery): Promise<AppointmentReadModel[]> {
    return this.appointmentReadRepository.findByCustomerId(query.customerId);
  }
}

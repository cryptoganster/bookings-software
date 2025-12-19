import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { AppointmentReadModel } from '@booking/domain/read-models/appointment';
import { Inject } from '@nestjs/common';
import { GetBusinessAppointmentsQuery } from '@booking/app/queries/get-business-appointments/query';
import { IAppointmentReadRepository } from '@booking/domain/interfaces/repositories/appointment-read';

@QueryHandler(GetBusinessAppointmentsQuery)
export class GetBusinessAppointmentsHandler implements IQueryHandler<GetBusinessAppointmentsQuery> {
  constructor(
    @Inject('IAppointmentReadRepository')
    private readonly appointmentReadRepository: IAppointmentReadRepository,
  ) {}

  async execute(query: GetBusinessAppointmentsQuery): Promise<AppointmentReadModel[]> {
    return this.appointmentReadRepository.findByBusinessId(query.businessId, query.filters);
  }
}

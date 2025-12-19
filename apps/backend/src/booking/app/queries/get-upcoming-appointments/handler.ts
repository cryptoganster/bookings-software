import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetUpcomingAppointmentsQuery } from '@booking/app/queries/get-upcoming-appointments/query';
import { AppointmentReadModel } from '@booking/domain/read-models/appointment';
import { IAppointmentReadRepository } from '@booking/domain/interfaces/repositories/appointment-read';

@QueryHandler(GetUpcomingAppointmentsQuery)
export class GetUpcomingAppointmentsHandler implements IQueryHandler<GetUpcomingAppointmentsQuery> {
  constructor(
    @Inject('IAppointmentReadRepository')
    private readonly appointmentReadRepo: IAppointmentReadRepository,
  ) {}

  async execute(query: GetUpcomingAppointmentsQuery): Promise<AppointmentReadModel[]> {
    return this.appointmentReadRepo.findUpcoming(query.businessId);
  }
}

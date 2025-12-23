import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetTodayAppointmentsQuery } from '@booking/app/queries/get-today-appointments/query';
import { AppointmentReadModel } from '@booking/domain/read-models/appointment';
import { IAppointmentReadRepository } from '@booking/domain/interfaces/repositories/appointment-read';

@QueryHandler(GetTodayAppointmentsQuery)
export class GetTodayAppointmentsHandler implements IQueryHandler<GetTodayAppointmentsQuery> {
  constructor(
    @Inject('IAppointmentReadRepository')
    private readonly appointmentReadRepo: IAppointmentReadRepository,
  ) {}

  async execute(query: GetTodayAppointmentsQuery): Promise<AppointmentReadModel[]> {
    return this.appointmentReadRepo.findToday(query.businessId);
  }
}

import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetAppointmentQuery } from './query';
import { AppointmentReadModel } from '@booking/domain/read-models/appointment';
import { IAppointmentReadRepository } from '@booking/domain/interfaces/repositories/appointment-read';

@QueryHandler(GetAppointmentQuery)
export class GetAppointmentHandler implements IQueryHandler<GetAppointmentQuery> {
  constructor(
    @Inject('IAppointmentReadRepository')
    private readonly appointmentReadRepository: IAppointmentReadRepository,
  ) {}

  async execute(query: GetAppointmentQuery): Promise<AppointmentReadModel | null> {
    return this.appointmentReadRepository.findById(query.appointmentId);
  }
}

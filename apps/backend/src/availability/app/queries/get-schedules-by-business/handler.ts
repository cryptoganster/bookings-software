import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetSchedulesByBusinessQuery } from '@availability/app/queries/get-schedules-by-business/query';
import { ScheduleReadModel } from '@availability/domain/read-models/schedule';
import { IScheduleReadRepository } from '@availability/domain/interfaces/repositories/schedule-read';

@QueryHandler(GetSchedulesByBusinessQuery)
export class GetSchedulesByBusinessHandler implements IQueryHandler<GetSchedulesByBusinessQuery> {
  constructor(
    @Inject('IScheduleReadRepository')
    private readonly scheduleReadRepository: IScheduleReadRepository,
  ) {}

  async execute(query: GetSchedulesByBusinessQuery): Promise<ScheduleReadModel[]> {
    return this.scheduleReadRepository.findByBusinessId(query.businessId);
  }
}

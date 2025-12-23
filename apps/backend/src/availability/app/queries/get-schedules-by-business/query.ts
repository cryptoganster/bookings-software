import { Query } from '@nestjs/cqrs';
import { ScheduleReadModel } from '@availability/domain/read-models/schedule';

export class GetSchedulesByBusinessQuery extends Query<ScheduleReadModel[]> {
  constructor(public readonly businessId: string) {
    super();
  }
}

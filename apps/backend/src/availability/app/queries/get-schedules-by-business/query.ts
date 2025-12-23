import { Query } from '@nestjs/cqrs';

/**
 * Query to get schedules by business
 * TODO: Implement full query logic and return type
 */
export class GetSchedulesByBusinessQuery extends Query<any[]> {
  constructor(public readonly businessId: string) {
    super();
  }
}

import { ScheduleReadModel } from '@availability/domain/read-models/schedule';

export interface IScheduleReadRepository {
  findById(scheduleId: string): Promise<ScheduleReadModel | null>;
  findByBusinessId(businessId: string): Promise<ScheduleReadModel[]>;
  findByBusinessAndDay(businessId: string, dayOfWeek: number): Promise<ScheduleReadModel | null>;
}

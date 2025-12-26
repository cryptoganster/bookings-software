import { Schedule } from '@availability/domain/aggregates/schedule';

export interface IScheduleWriteRepository {
  save(schedule: Schedule): Promise<void>;
  delete(scheduleId: string): Promise<void>;
}

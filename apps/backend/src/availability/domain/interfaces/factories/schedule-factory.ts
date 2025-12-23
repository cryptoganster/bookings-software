import { Schedule } from '@availability/domain/aggregates/schedule';

export interface IScheduleFactory {
  loadById(scheduleId: string): Promise<Schedule | null>;
  loadByBusinessAndDay(businessId: string, dayOfWeek: number): Promise<Schedule | null>;
}

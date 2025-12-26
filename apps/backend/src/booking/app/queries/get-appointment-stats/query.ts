import { Query } from '@shared/kernel';

export interface AppointmentStatsResult {
  appointmentsToday: number;
  appointmentsThisWeek: number;
}

export class GetAppointmentStatsQuery extends Query<AppointmentStatsResult> {
  constructor(public readonly businessId: string) {
    super();
  }
}

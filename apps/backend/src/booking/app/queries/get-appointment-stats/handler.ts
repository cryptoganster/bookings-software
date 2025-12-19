import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetAppointmentStatsQuery, AppointmentStatsResult } from '@booking/app/queries/get-appointment-stats/query';
import { IAppointmentReadRepository } from '@booking/domain/interfaces/repositories/appointment-read';

@QueryHandler(GetAppointmentStatsQuery)
export class GetAppointmentStatsHandler implements IQueryHandler<GetAppointmentStatsQuery> {
  constructor(
    @Inject('IAppointmentReadRepository')
    private readonly appointmentReadRepo: IAppointmentReadRepository,
  ) {}

  async execute(query: GetAppointmentStatsQuery): Promise<AppointmentStatsResult> {
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);

    // Get start of week (Monday)
    const startOfWeek = new Date(now);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    // Get end of week (Sunday)
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const [todayAppointments, weekAppointments] = await Promise.all([
      this.appointmentReadRepo.findByBusinessAndDateRange(
        query.businessId,
        startOfToday,
        endOfToday,
      ),
      this.appointmentReadRepo.findByBusinessAndDateRange(query.businessId, startOfWeek, endOfWeek),
    ]);

    return {
      appointmentsToday: todayAppointments.length,
      appointmentsThisWeek: weekAppointments.length,
    };
  }
}

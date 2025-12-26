import { Query } from '@shared/kernel';
import { AppointmentReadModel } from '@booking/domain/read-models/appointment';

export class GetTodayAppointmentsQuery extends Query<AppointmentReadModel[]> {
  constructor(public readonly businessId: string) {
    super();
  }
}

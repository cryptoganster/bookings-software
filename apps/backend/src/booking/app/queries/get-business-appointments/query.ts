import { Query } from '@nestjs/cqrs';
import { AppointmentReadModel } from '@booking/domain/read-models/appointment';

export interface AppointmentFilters {
  status?: 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  startDate?: Date;
  endDate?: Date;
  offeringId?: string;
  customerId?: string;
}

export class GetBusinessAppointmentsQuery extends Query<AppointmentReadModel[]> {
  constructor(
    public readonly businessId: string,
    public readonly filters?: AppointmentFilters,
  ) {
    super();
  }
}

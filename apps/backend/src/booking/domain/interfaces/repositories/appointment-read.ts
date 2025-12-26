import { AppointmentReadModel } from '@booking/domain/read-models/appointment';

export interface AppointmentFilters {
  status?: 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  startDate?: Date;
  endDate?: Date;
  offeringId?: string;
  customerId?: string;
}

export interface IAppointmentReadRepository {
  findById(id: string): Promise<AppointmentReadModel | null>;
  findByCustomerId(customerId: string): Promise<AppointmentReadModel[]>;
  findByBusinessId(
    businessId: string,
    filters?: AppointmentFilters,
  ): Promise<AppointmentReadModel[]>;
  findUpcoming(businessId: string): Promise<AppointmentReadModel[]>;
  findToday(businessId: string): Promise<AppointmentReadModel[]>;
  findByBusinessAndDateRange(
    businessId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<AppointmentReadModel[]>;
}

import { AppointmentReadModel } from '@booking/domain/read-models/appointment';

export interface IAppointmentReadRepository {
  findById(id: string): Promise<AppointmentReadModel | null>;
  findByCustomerId(customerId: string): Promise<AppointmentReadModel[]>;
  findByBusinessId(businessId: string): Promise<AppointmentReadModel[]>;
  findUpcoming(businessId: string): Promise<AppointmentReadModel[]>;
}

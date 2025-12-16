import { Appointment } from '@booking/domain/aggregates/appointment';
import { UUID } from '@shared/vo/uuid';

export interface IAppointmentWriteRepository {
  save(appointment: Appointment): Promise<void>;
  findById(id: UUID): Promise<Appointment | null>;
}

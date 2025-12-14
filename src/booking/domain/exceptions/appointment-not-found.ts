import { DomainException } from '@shared/kernel/exceptions/domain';

export class AppointmentNotFoundException extends DomainException {
  constructor(appointmentId: string) {
    super(`Appointment with id ${appointmentId} not found`);
  }
}

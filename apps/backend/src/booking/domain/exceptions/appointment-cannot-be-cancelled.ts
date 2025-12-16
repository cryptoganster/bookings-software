import { DomainException } from '@shared/kernel/exceptions/domain';

export class AppointmentCannotBeCancelledException extends DomainException {
  constructor() {
    super('Appointment cannot be cancelled in its current state');
  }
}

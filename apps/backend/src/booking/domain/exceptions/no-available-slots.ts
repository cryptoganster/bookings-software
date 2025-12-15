import { DomainException } from '@shared/kernel/exceptions/domain';

export class NoAvailableSlotsException extends DomainException {
  constructor() {
    super('No available slots for the selected date and time');
  }
}

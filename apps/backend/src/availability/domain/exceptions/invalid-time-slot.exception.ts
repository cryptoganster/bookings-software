import { DomainException } from '@shared/kernel/exceptions/domain';

export class InvalidTimeSlotException extends DomainException {
  constructor(startTime: string, endTime: string) {
    super(`Invalid time slot: start time (${startTime}) must be before end time (${endTime})`);
  }
}

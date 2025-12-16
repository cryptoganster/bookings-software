import { DomainException } from '@shared/kernel/exceptions/domain';

export class InvalidOfferingDurationException extends DomainException {
  constructor(minutes: number) {
    super(
      `Invalid duration: ${minutes} minutes. Must be multiple of 15, min 15, max 480`,
    );
  }
}

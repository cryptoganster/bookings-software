import { DomainException } from '@shared/kernel/exceptions/domain';

export class InvalidOfferingCapacityException extends DomainException {
  constructor(message: string) {
    super(message);
  }
}

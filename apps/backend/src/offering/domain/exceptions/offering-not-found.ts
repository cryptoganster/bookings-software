import { DomainException } from '@shared/kernel/exceptions/domain';

export class OfferingNotFoundException extends DomainException {
  constructor(offeringId: string) {
    super(`Offering with id ${offeringId} not found`);
  }
}

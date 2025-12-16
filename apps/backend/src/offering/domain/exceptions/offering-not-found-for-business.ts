import { DomainException } from '@shared/kernel/exceptions/domain';

export class OfferingNotFoundForBusinessException extends DomainException {
  constructor(offeringId: string, businessId: string) {
    super(`Offering ${offeringId} not found for business ${businessId}`);
  }
}

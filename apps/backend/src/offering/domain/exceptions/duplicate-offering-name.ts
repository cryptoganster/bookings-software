import { DomainException } from '@shared/kernel/exceptions/domain';

export class DuplicateOfferingNameException extends DomainException {
  constructor(name: string, businessId: string) {
    super(`Offering with name "${name}" already exists for business ${businessId}`);
  }
}

import { DomainException } from '@shared/kernel/exceptions/domain';

export class BusinessNotFoundException extends DomainException {
  constructor(businessId: string) {
    super(`Business with id ${businessId} not found`);
    this.name = 'BusinessNotFoundException';
  }
}

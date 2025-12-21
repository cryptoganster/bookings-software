import { DomainException } from '@shared/kernel/exceptions/domain';

export class BusinessOwnerNotFoundException extends DomainException {
  constructor(ownerId: string) {
    super(`BusinessOwner not found for user: ${ownerId}`);
    this.name = 'BusinessOwnerNotFoundException';
  }
}

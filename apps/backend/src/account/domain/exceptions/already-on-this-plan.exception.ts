import { DomainException } from '@shared/kernel/exceptions/domain';

export class AlreadyOnThisPlanException extends DomainException {
  constructor(businessOwnerId: string) {
    super(`BusinessOwner ${businessOwnerId} is already on this subscription plan`);
  }
}

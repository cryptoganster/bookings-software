import { DomainException } from '@shared/kernel/exceptions/domain';

export class SubscriptionNotActiveException extends DomainException {
  constructor(businessOwnerId: string) {
    super(`Subscription for BusinessOwner ${businessOwnerId} is not suspended, cannot restore`);
  }
}

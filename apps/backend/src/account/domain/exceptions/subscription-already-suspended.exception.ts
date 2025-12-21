import { DomainException } from '@shared/kernel/exceptions/domain';

export class SubscriptionAlreadySuspendedException extends DomainException {
  constructor(businessOwnerId: string) {
    super(`Subscription for BusinessOwner ${businessOwnerId} is already suspended`);
  }
}

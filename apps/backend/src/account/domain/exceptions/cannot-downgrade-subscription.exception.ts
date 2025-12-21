import { DomainException } from '@shared/kernel/exceptions/domain';

export class CannotDowngradeSubscriptionException extends DomainException {
  constructor(businessOwnerId: string) {
    super(
      `BusinessOwner ${businessOwnerId} cannot downgrade subscription. Only upgrades are allowed.`,
    );
  }
}

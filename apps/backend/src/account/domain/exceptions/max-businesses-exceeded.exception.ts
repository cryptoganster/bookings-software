import { DomainException } from '@shared/kernel/exceptions/domain';

export class MaxBusinessesExceededException extends DomainException {
  constructor(businessOwnerId: string, maxBusinesses: number) {
    super(
      `BusinessOwner ${businessOwnerId} has reached the maximum number of businesses (${maxBusinesses}). Upgrade your subscription plan to create more businesses.`,
    );
  }
}

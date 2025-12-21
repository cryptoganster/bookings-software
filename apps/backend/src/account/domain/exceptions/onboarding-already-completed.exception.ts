import { DomainException } from '@shared/kernel/exceptions/domain';

export class OnboardingAlreadyCompletedException extends DomainException {
  constructor(businessOwnerId: string) {
    super(`BusinessOwner ${businessOwnerId} has already completed onboarding`);
  }
}

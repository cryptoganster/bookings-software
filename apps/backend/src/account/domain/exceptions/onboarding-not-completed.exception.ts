import { DomainException } from '@shared/kernel/exceptions/domain';

export class OnboardingNotCompletedException extends DomainException {
  constructor(businessOwnerId: string) {
    super(`BusinessOwner ${businessOwnerId} has not completed onboarding yet`);
    this.name = 'OnboardingNotCompletedException';
  }
}

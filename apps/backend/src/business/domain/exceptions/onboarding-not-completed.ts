import { DomainException } from '@shared/kernel/exceptions/domain';

export class OnboardingNotCompletedException extends DomainException {
  constructor(ownerId: string) {
    super(`Cannot create business: User ${ownerId} has not completed onboarding`);
    this.name = 'OnboardingNotCompletedException';
  }
}

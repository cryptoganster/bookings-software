import { DomainException } from '@shared/kernel/exceptions/domain';

export class OnboardingNotCompletedException extends DomainException {
  constructor(userId: string) {
    super(
      `Cannot create business for user ${userId}: onboarding not completed. Please complete the onboarding process first.`,
    );
    this.name = 'OnboardingNotCompletedException';
  }
}

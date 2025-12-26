import { Command } from '@shared/kernel';

/**
 * CompleteOnboardingCommand
 *
 * Command to mark a BusinessOwner's onboarding as completed.
 *
 * Requirements: 3.1-3.5, 9.2
 */
export class CompleteOnboardingCommand extends Command<void> {
  constructor(public readonly businessOwnerId: string) {
    super();
  }
}

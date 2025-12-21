/**
 * BusinessOwnerOnboardingCompleted Domain Event
 * Se publica cuando un BusinessOwner completa el proceso de onboarding
 */
export class BusinessOwnerOnboardingCompleted {
  constructor(
    public readonly businessOwnerId: string,
    public readonly occurredAt: Date = new Date(),
  ) {}
}

import { VersionedAggregateRoot } from '@shared/kernel/versioned-aggregate-root';
import { UUID } from '@shared/vo/uuid';
import { SubscriptionPlan } from '@account/domain/vo/subscription-plan';
import { SubscriptionStatus } from '@account/domain/vo/subscription-status';
import { BusinessOwnerCreated } from '@account/domain/events/business-owner-created';
import { BusinessOwnerOnboardingCompleted } from '@account/domain/events/business-owner-onboarding-completed';
import { BusinessOwnerSubscriptionUpgraded } from '@account/domain/events/business-owner-subscription-upgraded';
import { BusinessOwnerSubscriptionSuspended } from '@account/domain/events/business-owner-subscription-suspended';
import { BusinessOwnerSubscriptionRestored } from '@account/domain/events/business-owner-subscription-restored';
import { OnboardingAlreadyCompletedException } from '@account/domain/exceptions/onboarding-already-completed.exception';
import { OnboardingNotCompletedException } from '@account/domain/exceptions/onboarding-not-completed.exception';
import { AlreadyOnThisPlanException } from '@account/domain/exceptions/already-on-this-plan.exception';
import { CannotDowngradeSubscriptionException } from '@account/domain/exceptions/cannot-downgrade-subscription.exception';
import { SubscriptionAlreadySuspendedException } from '@account/domain/exceptions/subscription-already-suspended.exception';
import { SubscriptionNotActiveException } from '@account/domain/exceptions/subscription-not-active.exception';

/**
 * BusinessOwner Aggregate
 * Gestiona el perfil de cuenta de un dueño de negocio con suscripción y límites
 */
export class BusinessOwner extends VersionedAggregateRoot {
  private id!: UUID;
  private userId!: UUID; // 1:1 con User (Auth BC)
  private subscriptionPlan!: SubscriptionPlan;
  private subscriptionStatus!: SubscriptionStatus;
  private onboardingCompleted!: boolean;
  private createdAt!: Date;

  /**
   * Factory method para crear un nuevo BusinessOwner
   * Se crea automáticamente cuando un User se registra con role BUSINESS_OWNER
   */
  static create(id: UUID, userId: UUID, subscriptionPlan: SubscriptionPlan): BusinessOwner {
    // Validaciones
    if (!userId) {
      throw new Error('userId is required');
    }
    if (!subscriptionPlan) {
      throw new Error('subscriptionPlan is required');
    }

    const owner = new BusinessOwner();
    owner.id = id;
    owner.userId = userId;
    owner.subscriptionPlan = subscriptionPlan;
    owner.subscriptionStatus = SubscriptionStatus.active();
    owner.onboardingCompleted = false;
    owner.createdAt = new Date();

    // Publicar evento y versionar
    owner.apply(
      new BusinessOwnerCreated(id.getValue(), userId.getValue(), subscriptionPlan.getName()),
    );
    owner.incrementVersion();

    return owner;
  }

  /**
   * Completa el proceso de onboarding
   * Debe completarse antes de crear el primer negocio
   */
  completeOnboarding(): void {
    if (this.onboardingCompleted) {
      throw new OnboardingAlreadyCompletedException(this.id.getValue());
    }

    this.onboardingCompleted = true;
    this.incrementVersion();
    this.apply(new BusinessOwnerOnboardingCompleted(this.id.getValue()));
  }

  /**
   * Mejora el plan de suscripción
   * Solo permite upgrades (FREE → BASIC → PRO → ENTERPRISE)
   */
  upgradeSubscription(newPlan: SubscriptionPlan): void {
    if (!this.onboardingCompleted) {
      throw new OnboardingNotCompletedException(this.id.getValue());
    }

    if (this.subscriptionPlan.equals(newPlan)) {
      throw new AlreadyOnThisPlanException(this.id.getValue());
    }

    if (!this.subscriptionPlan.canUpgradeTo(newPlan)) {
      throw new CannotDowngradeSubscriptionException(this.id.getValue());
    }

    const oldPlan = this.subscriptionPlan;
    this.subscriptionPlan = newPlan;
    this.incrementVersion();
    this.apply(
      new BusinessOwnerSubscriptionUpgraded(
        this.id.getValue(),
        oldPlan.getName(),
        newPlan.getName(),
      ),
    );
  }

  /**
   * Suspende la suscripción
   * Previene la creación de nuevas citas
   */
  suspendSubscription(): void {
    if (this.subscriptionStatus.isSuspended()) {
      throw new SubscriptionAlreadySuspendedException(this.id.getValue());
    }

    this.subscriptionStatus = SubscriptionStatus.suspended();
    this.incrementVersion();
    this.apply(new BusinessOwnerSubscriptionSuspended(this.id.getValue()));
  }

  /**
   * Restaura la suscripción
   * Permite crear nuevas citas nuevamente
   */
  restoreSubscription(): void {
    if (this.subscriptionStatus.isActive()) {
      throw new SubscriptionNotActiveException(this.id.getValue());
    }

    this.subscriptionStatus = SubscriptionStatus.active();
    this.incrementVersion();
    this.apply(new BusinessOwnerSubscriptionRestored(this.id.getValue()));
  }

  /**
   * Factory method para reconstruir desde persistencia
   * Preserva la versión para Optimistic Locking
   */
  static fromPersistence(
    id: UUID,
    userId: UUID,
    subscriptionPlan: SubscriptionPlan,
    subscriptionStatus: SubscriptionStatus,
    onboardingCompleted: boolean,
    createdAt: Date,
    version: number,
  ): BusinessOwner {
    const owner = new BusinessOwner();
    owner.id = id;
    owner.userId = userId;
    owner.subscriptionPlan = subscriptionPlan;
    owner.subscriptionStatus = subscriptionStatus;
    owner.onboardingCompleted = onboardingCompleted;
    owner.createdAt = createdAt;
    owner.setVersion(version); // Preservar versión para optimistic locking
    return owner;
  }

  // Getters
  getId(): UUID {
    return this.id;
  }

  getUserId(): UUID {
    return this.userId;
  }

  getSubscriptionPlan(): SubscriptionPlan {
    return this.subscriptionPlan;
  }

  getSubscriptionStatus(): SubscriptionStatus {
    return this.subscriptionStatus;
  }

  isOnboardingCompleted(): boolean {
    return this.onboardingCompleted;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }
}

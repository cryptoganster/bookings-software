import { describe, it, expect, beforeEach } from '@jest/globals';
import { BusinessOwner } from '../business-owner';
import { SubscriptionPlan } from '../../vo/subscription-plan';
import { SubscriptionStatus } from '../../vo/subscription-status';
import { UUID } from '@shared/vo/uuid';
import { AlreadyOnThisPlanException } from '../../exceptions/already-on-this-plan.exception';
import { CannotDowngradeSubscriptionException } from '../../exceptions/cannot-downgrade-subscription.exception';
import { OnboardingAlreadyCompletedException } from '../../exceptions/onboarding-already-completed.exception';
import { OnboardingNotCompletedException } from '../../exceptions/onboarding-not-completed.exception';
import { SubscriptionAlreadySuspendedException } from '../../exceptions/subscription-already-suspended.exception';
import { SubscriptionNotActiveException } from '../../exceptions/subscription-not-active.exception';
import { BusinessOwnerCreated } from '../../events/business-owner-created';
import { BusinessOwnerOnboardingCompleted } from '../../events/business-owner-onboarding-completed';
import { BusinessOwnerSubscriptionUpgraded } from '../../events/business-owner-subscription-upgraded';
import { BusinessOwnerSubscriptionSuspended } from '../../events/business-owner-subscription-suspended';
import { BusinessOwnerSubscriptionRestored } from '../../events/business-owner-subscription-restored';

describe('BusinessOwner Aggregate', () => {
  let businessOwnerId: UUID;
  let userId: UUID;

  beforeEach(() => {
    businessOwnerId = UUID.generate();
    userId = UUID.generate();
  });

  describe('create()', () => {
    it('should create a new BusinessOwner with FREE plan', () => {
      const businessOwner = BusinessOwner.create(businessOwnerId, userId, SubscriptionPlan.free());

      expect(businessOwner.getId().equals(businessOwnerId)).toBe(true);
      expect(businessOwner.getUserId().equals(userId)).toBe(true);
      expect(businessOwner.getSubscriptionPlan().equals(SubscriptionPlan.free())).toBe(true);
      expect(businessOwner.getSubscriptionStatus().isActive()).toBe(true);
      expect(businessOwner.isOnboardingCompleted()).toBe(false);
      expect(businessOwner.getVersion().getValue()).toBe(1);
    });

    it('should publish BusinessOwnerCreated event', () => {
      const businessOwner = BusinessOwner.create(businessOwnerId, userId, SubscriptionPlan.free());

      const events = businessOwner.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(BusinessOwnerCreated);
      expect((events[0] as BusinessOwnerCreated).businessOwnerId).toBe(businessOwnerId.getValue());
      expect((events[0] as BusinessOwnerCreated).userId).toBe(userId.getValue());
    });
  });

  describe('completeOnboarding()', () => {
    it('should complete onboarding successfully', () => {
      const businessOwner = BusinessOwner.create(businessOwnerId, userId, SubscriptionPlan.free());

      businessOwner.completeOnboarding();

      expect(businessOwner.isOnboardingCompleted()).toBe(true);
      expect(businessOwner.getVersion().getValue()).toBe(2);
    });

    it('should publish BusinessOwnerOnboardingCompleted event', () => {
      const businessOwner = BusinessOwner.create(businessOwnerId, userId, SubscriptionPlan.free());

      businessOwner.completeOnboarding();

      const events = businessOwner.getUncommittedEvents();
      expect(events).toHaveLength(2); // Created + OnboardingCompleted
      expect(events[1]).toBeInstanceOf(BusinessOwnerOnboardingCompleted);
    });

    it('should throw OnboardingAlreadyCompletedException if already completed', () => {
      const businessOwner = BusinessOwner.create(businessOwnerId, userId, SubscriptionPlan.free());

      businessOwner.completeOnboarding();

      expect(() => businessOwner.completeOnboarding()).toThrow(OnboardingAlreadyCompletedException);
    });
  });

  describe('upgradeSubscription()', () => {
    it('should upgrade from FREE to BASIC successfully', () => {
      const businessOwner = BusinessOwner.create(businessOwnerId, userId, SubscriptionPlan.free());
      businessOwner.completeOnboarding();

      businessOwner.upgradeSubscription(SubscriptionPlan.basic());

      expect(businessOwner.getSubscriptionPlan().equals(SubscriptionPlan.basic())).toBe(true);
      expect(businessOwner.getVersion().getValue()).toBe(3); // Created + Onboarding + Upgrade
    });

    it('should upgrade from BASIC to PRO successfully', () => {
      const businessOwner = BusinessOwner.create(businessOwnerId, userId, SubscriptionPlan.basic());
      businessOwner.completeOnboarding();

      businessOwner.upgradeSubscription(SubscriptionPlan.pro());

      expect(businessOwner.getSubscriptionPlan().equals(SubscriptionPlan.pro())).toBe(true);
    });

    it('should publish BusinessOwnerSubscriptionUpgraded event', () => {
      const businessOwner = BusinessOwner.create(businessOwnerId, userId, SubscriptionPlan.free());
      businessOwner.completeOnboarding();

      businessOwner.upgradeSubscription(SubscriptionPlan.basic());

      const events = businessOwner.getUncommittedEvents();
      expect(events).toHaveLength(3); // Created + Onboarding + Upgraded
      expect(events[2]).toBeInstanceOf(BusinessOwnerSubscriptionUpgraded);
    });

    it('should throw OnboardingNotCompletedException if onboarding not completed', () => {
      const businessOwner = BusinessOwner.create(businessOwnerId, userId, SubscriptionPlan.free());

      expect(() => businessOwner.upgradeSubscription(SubscriptionPlan.basic())).toThrow(
        OnboardingNotCompletedException,
      );
    });

    it('should throw AlreadyOnThisPlanException if upgrading to same plan', () => {
      const businessOwner = BusinessOwner.create(businessOwnerId, userId, SubscriptionPlan.free());
      businessOwner.completeOnboarding();

      expect(() => businessOwner.upgradeSubscription(SubscriptionPlan.free())).toThrow(
        AlreadyOnThisPlanException,
      );
    });

    it('should throw CannotDowngradeSubscriptionException if downgrading', () => {
      const businessOwner = BusinessOwner.create(businessOwnerId, userId, SubscriptionPlan.basic());
      businessOwner.completeOnboarding();

      expect(() => businessOwner.upgradeSubscription(SubscriptionPlan.free())).toThrow(
        CannotDowngradeSubscriptionException,
      );
    });
  });

  describe('suspendSubscription()', () => {
    it('should suspend subscription successfully', () => {
      const businessOwner = BusinessOwner.create(businessOwnerId, userId, SubscriptionPlan.free());

      businessOwner.suspendSubscription();

      expect(businessOwner.getSubscriptionStatus().isSuspended()).toBe(true);
      expect(businessOwner.getVersion().getValue()).toBe(2);
    });

    it('should publish BusinessOwnerSubscriptionSuspended event', () => {
      const businessOwner = BusinessOwner.create(businessOwnerId, userId, SubscriptionPlan.free());

      businessOwner.suspendSubscription();

      const events = businessOwner.getUncommittedEvents();
      expect(events).toHaveLength(2); // Created + Suspended
      expect(events[1]).toBeInstanceOf(BusinessOwnerSubscriptionSuspended);
    });

    it('should throw SubscriptionAlreadySuspendedException if already suspended', () => {
      const businessOwner = BusinessOwner.create(businessOwnerId, userId, SubscriptionPlan.free());

      businessOwner.suspendSubscription();

      expect(() => businessOwner.suspendSubscription()).toThrow(
        SubscriptionAlreadySuspendedException,
      );
    });
  });

  describe('restoreSubscription()', () => {
    it('should restore subscription successfully', () => {
      const businessOwner = BusinessOwner.create(businessOwnerId, userId, SubscriptionPlan.free());
      businessOwner.suspendSubscription();

      businessOwner.restoreSubscription();

      expect(businessOwner.getSubscriptionStatus().isActive()).toBe(true);
      expect(businessOwner.getVersion().getValue()).toBe(3); // Created + Suspended + Restored
    });

    it('should publish BusinessOwnerSubscriptionRestored event', () => {
      const businessOwner = BusinessOwner.create(businessOwnerId, userId, SubscriptionPlan.free());
      businessOwner.suspendSubscription();

      businessOwner.restoreSubscription();

      const events = businessOwner.getUncommittedEvents();
      expect(events).toHaveLength(3); // Created + Suspended + Restored
      expect(events[2]).toBeInstanceOf(BusinessOwnerSubscriptionRestored);
    });

    it('should throw SubscriptionNotActiveException if already active', () => {
      const businessOwner = BusinessOwner.create(businessOwnerId, userId, SubscriptionPlan.free());

      expect(() => businessOwner.restoreSubscription()).toThrow(SubscriptionNotActiveException);
    });
  });

  describe('fromPersistence()', () => {
    it('should reconstruct BusinessOwner from persistence', () => {
      const businessOwner = BusinessOwner.fromPersistence(
        businessOwnerId,
        userId,
        SubscriptionPlan.pro(),
        SubscriptionStatus.active(),
        true,
        new Date(),
        5,
      );

      expect(businessOwner.getId().equals(businessOwnerId)).toBe(true);
      expect(businessOwner.getUserId().equals(userId)).toBe(true);
      expect(businessOwner.getSubscriptionPlan().equals(SubscriptionPlan.pro())).toBe(true);
      expect(businessOwner.getSubscriptionStatus().isActive()).toBe(true);
      expect(businessOwner.isOnboardingCompleted()).toBe(true);
      expect(businessOwner.getVersion().getValue()).toBe(5);
    });

    it('should not publish events when reconstructing from persistence', () => {
      const businessOwner = BusinessOwner.fromPersistence(
        businessOwnerId,
        userId,
        SubscriptionPlan.pro(),
        SubscriptionStatus.active(),
        true,
        new Date(),
        5,
      );

      const events = businessOwner.getUncommittedEvents();
      expect(events).toHaveLength(0);
    });
  });
});

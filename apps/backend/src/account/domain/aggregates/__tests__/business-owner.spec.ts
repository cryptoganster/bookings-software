import { BusinessOwner } from '../business-owner';
import { SubscriptionPlan } from '../../vo/subscription-plan';
import { SubscriptionStatus } from '../../vo/subscription-status';
import { UUID } from '@shared/vo/uuid';
import { AlreadyOnThisPlanException } from '../../exceptions/already-on-this-plan.exception';
import { CannotDowngradeSubscriptionException } from '../../exceptions/cannot-downgrade-subscription.exception';
import { OnboardingAlreadyCompletedException } from '../../exceptions/onboarding-already-completed.exception';
import { SubscriptionAlreadySuspendedException } from '../../exceptions/subscription-already-suspended.exception';
import { BusinessOwnerCreated } from '../../events/business-owner-created';
import { BusinessOwnerOnboardingCompleted } from '../../events/business-owner-onboarding-completed';
import { BusinessOwnerSubscriptionUpgraded } from '../../events/business-owner-subscription-upgraded';
import { BusinessOwnerSubscriptionSuspended } from '../../events/business-owner-subscription-suspended';
import { BusinessOwnerSubscriptionRestored } from '../../events/business-owner-subscription-restored';

describe('BusinessOwner Aggregate', () => {
  describe('create()', () => {
    it('should create aggregate with correct initial state', () => {
      const id = UUID.generate();
      const userId = UUID.generate();
      const plan = SubscriptionPlan.free();

      const businessOwner = BusinessOwner.create(id, userId, plan);

      expect(businessOwner.getId().equals(id)).toBe(true);
      expect(businessOwner.getUserId().equals(userId)).toBe(true);
      expect(businessOwner.getSubscriptionPlan().equals(plan)).toBe(true);
      expect(businessOwner.getSubscriptionStatus().isActive()).toBe(true);
      expect(businessOwner.isOnboardingCompleted()).toBe(false);
    });

    it('should set onboardingCompleted=false by default', () => {
      const businessOwner = BusinessOwner.create(
        UUID.generate(),
        UUID.generate(),
        SubscriptionPlan.free(),
      );

      expect(businessOwner.isOnboardingCompleted()).toBe(false);
    });

    it('should set subscriptionStatus=ACTIVE by default', () => {
      const businessOwner = BusinessOwner.create(
        UUID.generate(),
        UUID.generate(),
        SubscriptionPlan.free(),
      );

      expect(businessOwner.getSubscriptionStatus().isActive()).toBe(true);
    });

    it('should generate BusinessOwnerCreated event', () => {
      const id = UUID.generate();
      const userId = UUID.generate();
      const plan = SubscriptionPlan.free();

      const businessOwner = BusinessOwner.create(id, userId, plan);
      const events = businessOwner.getUncommittedEvents();

      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(BusinessOwnerCreated);
      expect((events[0] as BusinessOwnerCreated).businessOwnerId).toBe(id.getValue());
      expect((events[0] as BusinessOwnerCreated).userId).toBe(userId.getValue());
    });

    it('should increment version to 1', () => {
      const businessOwner = BusinessOwner.create(
        UUID.generate(),
        UUID.generate(),
        SubscriptionPlan.free(),
      );

      expect(businessOwner.getVersion().getValue()).toBe(1);
    });

    it('should throw error if userId is null', () => {
      expect(() => {
        BusinessOwner.create(UUID.generate(), null as any, SubscriptionPlan.free());
      }).toThrow();
    });

    it('should throw error if subscriptionPlan is invalid', () => {
      expect(() => {
        BusinessOwner.create(UUID.generate(), UUID.generate(), null as any);
      }).toThrow();
    });
  });

  describe('completeOnboarding()', () => {
    it('should change onboardingCompleted to true', () => {
      const businessOwner = BusinessOwner.create(
        UUID.generate(),
        UUID.generate(),
        SubscriptionPlan.free(),
      );

      businessOwner.completeOnboarding();

      expect(businessOwner.isOnboardingCompleted()).toBe(true);
    });

    it('should generate BusinessOwnerOnboardingCompleted event', () => {
      const id = UUID.generate();
      const businessOwner = BusinessOwner.create(id, UUID.generate(), SubscriptionPlan.free());

      businessOwner.completeOnboarding();
      const events = businessOwner.getUncommittedEvents();

      // Should have 2 events: BusinessOwnerCreated + BusinessOwnerOnboardingCompleted
      expect(events).toHaveLength(2);
      expect(events[1]).toBeInstanceOf(BusinessOwnerOnboardingCompleted);
      expect((events[1] as BusinessOwnerOnboardingCompleted).businessOwnerId).toBe(id.getValue());
    });

    it('should increment version', () => {
      const businessOwner = BusinessOwner.create(
        UUID.generate(),
        UUID.generate(),
        SubscriptionPlan.free(),
      );

      const initialVersion = businessOwner.getVersion().getValue();
      businessOwner.completeOnboarding();

      expect(businessOwner.getVersion().getValue()).toBe(initialVersion + 1);
    });

    it('should throw OnboardingAlreadyCompletedException if already completed', () => {
      const businessOwner = BusinessOwner.create(
        UUID.generate(),
        UUID.generate(),
        SubscriptionPlan.free(),
      );

      businessOwner.completeOnboarding();

      expect(() => {
        businessOwner.completeOnboarding();
      }).toThrow(OnboardingAlreadyCompletedException);
    });

    it('should be idempotent (calling twice throws exception)', () => {
      const businessOwner = BusinessOwner.create(
        UUID.generate(),
        UUID.generate(),
        SubscriptionPlan.free(),
      );

      businessOwner.completeOnboarding();

      expect(() => {
        businessOwner.completeOnboarding();
      }).toThrow(OnboardingAlreadyCompletedException);
    });
  });

  describe('upgradeSubscription()', () => {
    it('should upgrade from FREE to BASIC successfully', () => {
      const businessOwner = BusinessOwner.create(
        UUID.generate(),
        UUID.generate(),
        SubscriptionPlan.free(),
      );

      businessOwner.completeOnboarding(); // Complete onboarding first

      const basicPlan = SubscriptionPlan.basic();
      businessOwner.upgradeSubscription(basicPlan);

      expect(businessOwner.getSubscriptionPlan().equals(basicPlan)).toBe(true);
    });

    it('should upgrade from BASIC to PRO successfully', () => {
      const businessOwner = BusinessOwner.create(
        UUID.generate(),
        UUID.generate(),
        SubscriptionPlan.basic(),
      );

      businessOwner.completeOnboarding(); // Complete onboarding first

      const proPlan = SubscriptionPlan.pro();
      businessOwner.upgradeSubscription(proPlan);

      expect(businessOwner.getSubscriptionPlan().equals(proPlan)).toBe(true);
    });

    it('should upgrade from PRO to ENTERPRISE successfully', () => {
      const businessOwner = BusinessOwner.create(
        UUID.generate(),
        UUID.generate(),
        SubscriptionPlan.pro(),
      );

      businessOwner.completeOnboarding(); // Complete onboarding first

      const enterprisePlan = SubscriptionPlan.enterprise();
      businessOwner.upgradeSubscription(enterprisePlan);

      expect(businessOwner.getSubscriptionPlan().equals(enterprisePlan)).toBe(true);
    });

    it('should generate BusinessOwnerSubscriptionUpgraded event with old and new plans', () => {
      const id = UUID.generate();
      const businessOwner = BusinessOwner.create(id, UUID.generate(), SubscriptionPlan.free());

      businessOwner.completeOnboarding(); // Complete onboarding first

      const basicPlan = SubscriptionPlan.basic();
      businessOwner.upgradeSubscription(basicPlan);
      const events = businessOwner.getUncommittedEvents();

      // Should have 3 events: BusinessOwnerCreated + BusinessOwnerOnboardingCompleted + BusinessOwnerSubscriptionUpgraded
      expect(events).toHaveLength(3);
      expect(events[2]).toBeInstanceOf(BusinessOwnerSubscriptionUpgraded);
      expect((events[2] as BusinessOwnerSubscriptionUpgraded).businessOwnerId).toBe(id.getValue());
      expect((events[2] as BusinessOwnerSubscriptionUpgraded).oldPlan).toBe('FREE');
      expect((events[2] as BusinessOwnerSubscriptionUpgraded).newPlan).toBe('BASIC');
    });

    it('should increment version', () => {
      const businessOwner = BusinessOwner.create(
        UUID.generate(),
        UUID.generate(),
        SubscriptionPlan.free(),
      );

      businessOwner.completeOnboarding(); // Complete onboarding first

      const initialVersion = businessOwner.getVersion().getValue();
      businessOwner.upgradeSubscription(SubscriptionPlan.basic());

      expect(businessOwner.getVersion().getValue()).toBe(initialVersion + 1);
    });

    it('should throw AlreadyOnThisPlanException when upgrading to same plan', () => {
      const businessOwner = BusinessOwner.create(
        UUID.generate(),
        UUID.generate(),
        SubscriptionPlan.free(),
      );

      businessOwner.completeOnboarding(); // Complete onboarding first

      expect(() => {
        businessOwner.upgradeSubscription(SubscriptionPlan.free());
      }).toThrow(AlreadyOnThisPlanException);
    });

    it('should throw CannotDowngradeSubscriptionException when downgrading', () => {
      const businessOwner = BusinessOwner.create(
        UUID.generate(),
        UUID.generate(),
        SubscriptionPlan.pro(),
      );

      businessOwner.completeOnboarding(); // Complete onboarding first

      expect(() => {
        businessOwner.upgradeSubscription(SubscriptionPlan.basic());
      }).toThrow(CannotDowngradeSubscriptionException);
    });

    it('should throw CannotDowngradeSubscriptionException for PRO→BASIC', () => {
      const businessOwner = BusinessOwner.create(
        UUID.generate(),
        UUID.generate(),
        SubscriptionPlan.pro(),
      );

      businessOwner.completeOnboarding(); // Complete onboarding first

      expect(() => {
        businessOwner.upgradeSubscription(SubscriptionPlan.basic());
      }).toThrow(CannotDowngradeSubscriptionException);
    });

    it('should throw CannotDowngradeSubscriptionException for ENTERPRISE→PRO', () => {
      const businessOwner = BusinessOwner.create(
        UUID.generate(),
        UUID.generate(),
        SubscriptionPlan.enterprise(),
      );

      businessOwner.completeOnboarding(); // Complete onboarding first

      expect(() => {
        businessOwner.upgradeSubscription(SubscriptionPlan.pro());
      }).toThrow(CannotDowngradeSubscriptionException);
    });
  });

  describe('suspendSubscription()', () => {
    it('should change subscriptionStatus to SUSPENDED', () => {
      const businessOwner = BusinessOwner.create(
        UUID.generate(),
        UUID.generate(),
        SubscriptionPlan.free(),
      );

      businessOwner.suspendSubscription();

      expect(businessOwner.getSubscriptionStatus().isSuspended()).toBe(true);
    });

    it('should generate BusinessOwnerSubscriptionSuspended event', () => {
      const id = UUID.generate();
      const businessOwner = BusinessOwner.create(id, UUID.generate(), SubscriptionPlan.free());

      businessOwner.suspendSubscription();
      const events = businessOwner.getUncommittedEvents();

      // Should have 2 events: BusinessOwnerCreated + BusinessOwnerSubscriptionSuspended
      expect(events).toHaveLength(2);
      expect(events[1]).toBeInstanceOf(BusinessOwnerSubscriptionSuspended);
      expect((events[1] as BusinessOwnerSubscriptionSuspended).businessOwnerId).toBe(id.getValue());
    });

    it('should increment version', () => {
      const businessOwner = BusinessOwner.create(
        UUID.generate(),
        UUID.generate(),
        SubscriptionPlan.free(),
      );

      const initialVersion = businessOwner.getVersion().getValue();
      businessOwner.suspendSubscription();

      expect(businessOwner.getVersion().getValue()).toBe(initialVersion + 1);
    });

    it('should throw error if already suspended', () => {
      const businessOwner = BusinessOwner.create(
        UUID.generate(),
        UUID.generate(),
        SubscriptionPlan.free(),
      );

      businessOwner.suspendSubscription();

      expect(() => {
        businessOwner.suspendSubscription();
      }).toThrow(SubscriptionAlreadySuspendedException);
    });
  });

  describe('restoreSubscription()', () => {
    it('should change subscriptionStatus to ACTIVE', () => {
      const businessOwner = BusinessOwner.create(
        UUID.generate(),
        UUID.generate(),
        SubscriptionPlan.free(),
      );

      businessOwner.suspendSubscription();
      businessOwner.restoreSubscription();

      expect(businessOwner.getSubscriptionStatus().isActive()).toBe(true);
    });

    it('should generate BusinessOwnerSubscriptionRestored event', () => {
      const id = UUID.generate();
      const businessOwner = BusinessOwner.create(id, UUID.generate(), SubscriptionPlan.free());

      businessOwner.suspendSubscription();
      businessOwner.restoreSubscription();
      const events = businessOwner.getUncommittedEvents();

      // Should have 3 events: Created + Suspended + Restored
      expect(events).toHaveLength(3);
      expect(events[2]).toBeInstanceOf(BusinessOwnerSubscriptionRestored);
      expect((events[2] as BusinessOwnerSubscriptionRestored).businessOwnerId).toBe(id.getValue());
    });

    it('should increment version', () => {
      const businessOwner = BusinessOwner.create(
        UUID.generate(),
        UUID.generate(),
        SubscriptionPlan.free(),
      );

      businessOwner.suspendSubscription();
      const versionAfterSuspend = businessOwner.getVersion().getValue();
      businessOwner.restoreSubscription();

      expect(businessOwner.getVersion().getValue()).toBe(versionAfterSuspend + 1);
    });

    it('should throw error if already active (not idempotent)', () => {
      const businessOwner = BusinessOwner.create(
        UUID.generate(),
        UUID.generate(),
        SubscriptionPlan.free(),
      );

      // Already active, should throw
      expect(() => {
        businessOwner.restoreSubscription();
      }).toThrow();
    });
  });

  describe('fromPersistence()', () => {
    it('should reconstruct aggregate with all fields', () => {
      const id = UUID.generate();
      const userId = UUID.generate();
      const plan = SubscriptionPlan.pro();
      const status = SubscriptionStatus.active();
      const version = 5;

      const businessOwner = BusinessOwner.fromPersistence(
        id,
        userId,
        plan,
        status,
        true,
        new Date(),
        version,
      );

      expect(businessOwner.getId().equals(id)).toBe(true);
      expect(businessOwner.getUserId().equals(userId)).toBe(true);
      expect(businessOwner.getSubscriptionPlan().equals(plan)).toBe(true);
      expect(businessOwner.getSubscriptionStatus().equals(status)).toBe(true);
      expect(businessOwner.isOnboardingCompleted()).toBe(true);
      expect(businessOwner.getVersion().getValue()).toBe(version);
    });

    it('should preserve version from database', () => {
      const version = 42;

      const businessOwner = BusinessOwner.fromPersistence(
        UUID.generate(),
        UUID.generate(),
        SubscriptionPlan.free(),
        SubscriptionStatus.active(),
        false,
        new Date(),
        version,
      );

      expect(businessOwner.getVersion().getValue()).toBe(version);
    });

    it('should not generate events', () => {
      const businessOwner = BusinessOwner.fromPersistence(
        UUID.generate(),
        UUID.generate(),
        SubscriptionPlan.free(),
        SubscriptionStatus.active(),
        false,
        new Date(),
        1,
      );

      const events = businessOwner.getUncommittedEvents();
      expect(events).toHaveLength(0);
    });

    it('should handle all subscription plans correctly', () => {
      const plans = [
        SubscriptionPlan.free(),
        SubscriptionPlan.basic(),
        SubscriptionPlan.pro(),
        SubscriptionPlan.enterprise(),
      ];

      plans.forEach((plan) => {
        const businessOwner = BusinessOwner.fromPersistence(
          UUID.generate(),
          UUID.generate(),
          plan,
          SubscriptionStatus.active(),
          false,
          new Date(),
          1,
        );

        expect(businessOwner.getSubscriptionPlan().equals(plan)).toBe(true);
      });
    });

    it('should handle all subscription statuses correctly', () => {
      const statuses = [
        SubscriptionStatus.active(),
        SubscriptionStatus.suspended(),
        SubscriptionStatus.cancelled(),
      ];

      statuses.forEach((status) => {
        const businessOwner = BusinessOwner.fromPersistence(
          UUID.generate(),
          UUID.generate(),
          SubscriptionPlan.free(),
          status,
          false,
          new Date(),
          1,
        );

        expect(businessOwner.getSubscriptionStatus().equals(status)).toBe(true);
      });
    });
  });
});

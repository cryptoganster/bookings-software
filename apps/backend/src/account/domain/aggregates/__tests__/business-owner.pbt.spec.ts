import { describe, it, expect } from '@jest/globals';
import * as fc from 'fast-check';
import { BusinessOwner } from '../business-owner';
import { SubscriptionPlan } from '../../vo/subscription-plan';
import { UUID } from '@shared/vo/uuid';

/**
 * Property-Based Tests for BusinessOwner Aggregate
 *
 * These tests verify universal properties that should hold across all inputs.
 */
describe('BusinessOwner Aggregate - Property-Based Tests', () => {
  /**
   * Property 1: Subscription upgrade is monotonic
   * Validates: Requirements 4.1, 4.4
   *
   * For any BusinessOwner, upgrading subscription should always result in:
   * - Higher or equal maxBusinesses
   * - Higher or equal maxAppointmentsPerMonth
   * - Higher or equal price
   */
  describe('Property 1: Subscription upgrade is monotonic', () => {
    const planArbitrary: fc.Arbitrary<SubscriptionPlan> = fc.constantFrom(
      SubscriptionPlan.free(),
      SubscriptionPlan.basic(),
      SubscriptionPlan.pro(),
      SubscriptionPlan.enterprise(),
    );

    it('should always increase or maintain limits when upgrading', () => {
      fc.assert(
        fc.property(planArbitrary, planArbitrary, (currentPlan, newPlan) => {
          // Skip if not a valid upgrade
          if (!currentPlan.canUpgradeTo(newPlan)) {
            return true;
          }

          // Create BusinessOwner with current plan
          const businessOwner = BusinessOwner.create(UUID.generate(), UUID.generate(), currentPlan);
          businessOwner.completeOnboarding();

          // Get current limits
          const currentMaxBusinesses = currentPlan.getMaxBusinesses();
          const currentMaxAppointments = currentPlan.getMaxAppointmentsPerMonth();
          const currentPrice = currentPlan.getPrice();

          // Upgrade
          businessOwner.upgradeSubscription(newPlan);

          // Get new limits
          const newMaxBusinesses = newPlan.getMaxBusinesses();
          const newMaxAppointments = newPlan.getMaxAppointmentsPerMonth();
          const newPrice = newPlan.getPrice();

          // Verify monotonicity: new limits >= current limits
          expect(newMaxBusinesses).toBeGreaterThanOrEqual(currentMaxBusinesses);
          expect(newMaxAppointments).toBeGreaterThanOrEqual(currentMaxAppointments);
          expect(newPrice).toBeGreaterThanOrEqual(currentPrice);
        }),
        { numRuns: 100 },
      );
    });

    it('should never allow downgrade (reverse monotonicity)', () => {
      fc.assert(
        fc.property(planArbitrary, planArbitrary, (currentPlan, newPlan) => {
          // If new plan has lower limits, it should not be a valid upgrade
          const currentMaxBusinesses = currentPlan.getMaxBusinesses();
          const newMaxBusinesses = newPlan.getMaxBusinesses();

          if (newMaxBusinesses < currentMaxBusinesses) {
            expect(currentPlan.canUpgradeTo(newPlan)).toBe(false);
          }
        }),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Property 2: Version increments on state changes
   * Validates: Requirements 6.4
   *
   * For any BusinessOwner, any state-changing operation should increment version by exactly 1.
   */
  describe('Property 2: Version increments on state changes', () => {
    const planArbitrary: fc.Arbitrary<SubscriptionPlan> = fc.constantFrom(
      SubscriptionPlan.free(),
      SubscriptionPlan.basic(),
      SubscriptionPlan.pro(),
      SubscriptionPlan.enterprise(),
    );

    it('should increment version by 1 on completeOnboarding()', () => {
      fc.assert(
        fc.property(planArbitrary, (plan) => {
          const businessOwner = BusinessOwner.create(UUID.generate(), UUID.generate(), plan);

          const versionBefore = businessOwner.getVersion().getValue();
          businessOwner.completeOnboarding();
          const versionAfter = businessOwner.getVersion().getValue();

          expect(versionAfter).toBe(versionBefore + 1);
        }),
        { numRuns: 100 },
      );
    });

    it('should increment version by 1 on upgradeSubscription()', () => {
      fc.assert(
        fc.property(planArbitrary, planArbitrary, (currentPlan, newPlan) => {
          // Skip if not a valid upgrade
          if (!currentPlan.canUpgradeTo(newPlan)) {
            return true;
          }

          const businessOwner = BusinessOwner.create(UUID.generate(), UUID.generate(), currentPlan);
          businessOwner.completeOnboarding();

          const versionBefore = businessOwner.getVersion().getValue();
          businessOwner.upgradeSubscription(newPlan);
          const versionAfter = businessOwner.getVersion().getValue();

          expect(versionAfter).toBe(versionBefore + 1);
        }),
        { numRuns: 100 },
      );
    });

    it('should increment version by 1 on suspendSubscription()', () => {
      fc.assert(
        fc.property(planArbitrary, (plan) => {
          const businessOwner = BusinessOwner.create(UUID.generate(), UUID.generate(), plan);

          const versionBefore = businessOwner.getVersion().getValue();
          businessOwner.suspendSubscription();
          const versionAfter = businessOwner.getVersion().getValue();

          expect(versionAfter).toBe(versionBefore + 1);
        }),
        { numRuns: 100 },
      );
    });

    it('should increment version by 1 on restoreSubscription()', () => {
      fc.assert(
        fc.property(planArbitrary, (plan) => {
          const businessOwner = BusinessOwner.create(UUID.generate(), UUID.generate(), plan);
          businessOwner.suspendSubscription();

          const versionBefore = businessOwner.getVersion().getValue();
          businessOwner.restoreSubscription();
          const versionAfter = businessOwner.getVersion().getValue();

          expect(versionAfter).toBe(versionBefore + 1);
        }),
        { numRuns: 100 },
      );
    });

    it('should have version = 1 after create()', () => {
      fc.assert(
        fc.property(planArbitrary, (plan) => {
          const businessOwner = BusinessOwner.create(UUID.generate(), UUID.generate(), plan);

          expect(businessOwner.getVersion().getValue()).toBe(1);
        }),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Additional Property: Idempotency of status checks
   *
   * For any BusinessOwner, calling status check methods multiple times
   * should always return the same result.
   */
  describe('Property 3: Idempotency of status checks', () => {
    const planArbitrary: fc.Arbitrary<SubscriptionPlan> = fc.constantFrom(
      SubscriptionPlan.free(),
      SubscriptionPlan.basic(),
      SubscriptionPlan.pro(),
      SubscriptionPlan.enterprise(),
    );

    it('isOnboardingCompleted() should be idempotent', () => {
      fc.assert(
        fc.property(planArbitrary, fc.boolean(), (plan, shouldComplete) => {
          const businessOwner = BusinessOwner.create(UUID.generate(), UUID.generate(), plan);

          if (shouldComplete) {
            businessOwner.completeOnboarding();
          }

          const result1 = businessOwner.isOnboardingCompleted();
          const result2 = businessOwner.isOnboardingCompleted();
          const result3 = businessOwner.isOnboardingCompleted();

          expect(result1).toBe(result2);
          expect(result2).toBe(result3);
        }),
        { numRuns: 100 },
      );
    });

    it('getSubscriptionStatus() checks should be idempotent', () => {
      fc.assert(
        fc.property(planArbitrary, fc.boolean(), (plan, shouldSuspend) => {
          const businessOwner = BusinessOwner.create(UUID.generate(), UUID.generate(), plan);

          if (shouldSuspend) {
            businessOwner.suspendSubscription();
          }

          const isActive1 = businessOwner.getSubscriptionStatus().isActive();
          const isActive2 = businessOwner.getSubscriptionStatus().isActive();
          const isSuspended1 = businessOwner.getSubscriptionStatus().isSuspended();
          const isSuspended2 = businessOwner.getSubscriptionStatus().isSuspended();

          expect(isActive1).toBe(isActive2);
          expect(isSuspended1).toBe(isSuspended2);
        }),
        { numRuns: 100 },
      );
    });
  });
});

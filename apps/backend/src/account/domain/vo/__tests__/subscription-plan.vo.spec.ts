import { describe, it, expect } from '@jest/globals';
import { SubscriptionPlan } from '../subscription-plan';

describe('SubscriptionPlan Value Object', () => {
  describe('Factory Methods', () => {
    it('should create FREE plan with correct values', () => {
      const plan = SubscriptionPlan.free();

      expect(plan.getName()).toBe('FREE');
      expect(plan.getMaxBusinesses()).toBe(1);
      expect(plan.getMaxAppointmentsPerMonth()).toBe(100);
      expect(plan.getPrice()).toBe(0);
    });

    it('should create BASIC plan with correct values', () => {
      const plan = SubscriptionPlan.basic();

      expect(plan.getName()).toBe('BASIC');
      expect(plan.getMaxBusinesses()).toBe(1);
      expect(plan.getMaxAppointmentsPerMonth()).toBe(500);
      expect(plan.getPrice()).toBe(29);
    });

    it('should create PRO plan with correct values', () => {
      const plan = SubscriptionPlan.pro();

      expect(plan.getName()).toBe('PRO');
      expect(plan.getMaxBusinesses()).toBe(3);
      expect(plan.getMaxAppointmentsPerMonth()).toBe(2000);
      expect(plan.getPrice()).toBe(79);
    });

    it('should create ENTERPRISE plan with correct values', () => {
      const plan = SubscriptionPlan.enterprise();

      expect(plan.getName()).toBe('ENTERPRISE');
      expect(plan.getMaxBusinesses()).toBe(10);
      expect(plan.getMaxAppointmentsPerMonth()).toBe(10000);
      expect(plan.getPrice()).toBe(199);
    });
  });

  describe('canUpgradeTo()', () => {
    it('should allow upgrade from FREE to BASIC', () => {
      const freePlan = SubscriptionPlan.free();
      const basicPlan = SubscriptionPlan.basic();

      expect(freePlan.canUpgradeTo(basicPlan)).toBe(true);
    });

    it('should allow upgrade from FREE to PRO', () => {
      const freePlan = SubscriptionPlan.free();
      const proPlan = SubscriptionPlan.pro();

      expect(freePlan.canUpgradeTo(proPlan)).toBe(true);
    });

    it('should allow upgrade from FREE to ENTERPRISE', () => {
      const freePlan = SubscriptionPlan.free();
      const enterprisePlan = SubscriptionPlan.enterprise();

      expect(freePlan.canUpgradeTo(enterprisePlan)).toBe(true);
    });

    it('should allow upgrade from BASIC to PRO', () => {
      const basicPlan = SubscriptionPlan.basic();
      const proPlan = SubscriptionPlan.pro();

      expect(basicPlan.canUpgradeTo(proPlan)).toBe(true);
    });

    it('should allow upgrade from BASIC to ENTERPRISE', () => {
      const basicPlan = SubscriptionPlan.basic();
      const enterprisePlan = SubscriptionPlan.enterprise();

      expect(basicPlan.canUpgradeTo(enterprisePlan)).toBe(true);
    });

    it('should allow upgrade from PRO to ENTERPRISE', () => {
      const proPlan = SubscriptionPlan.pro();
      const enterprisePlan = SubscriptionPlan.enterprise();

      expect(proPlan.canUpgradeTo(enterprisePlan)).toBe(true);
    });

    it('should NOT allow downgrade from BASIC to FREE', () => {
      const basicPlan = SubscriptionPlan.basic();
      const freePlan = SubscriptionPlan.free();

      expect(basicPlan.canUpgradeTo(freePlan)).toBe(false);
    });

    it('should NOT allow downgrade from PRO to BASIC', () => {
      const proPlan = SubscriptionPlan.pro();
      const basicPlan = SubscriptionPlan.basic();

      expect(proPlan.canUpgradeTo(basicPlan)).toBe(false);
    });

    it('should NOT allow downgrade from ENTERPRISE to PRO', () => {
      const enterprisePlan = SubscriptionPlan.enterprise();
      const proPlan = SubscriptionPlan.pro();

      expect(enterprisePlan.canUpgradeTo(proPlan)).toBe(false);
    });

    it('should NOT allow upgrade to same plan', () => {
      const freePlan = SubscriptionPlan.free();
      const anotherFreePlan = SubscriptionPlan.free();

      expect(freePlan.canUpgradeTo(anotherFreePlan)).toBe(false);
    });
  });

  describe('Equality', () => {
    it('should consider two FREE plans equal', () => {
      const plan1 = SubscriptionPlan.free();
      const plan2 = SubscriptionPlan.free();

      expect(plan1.equals(plan2)).toBe(true);
    });

    it('should consider two BASIC plans equal', () => {
      const plan1 = SubscriptionPlan.basic();
      const plan2 = SubscriptionPlan.basic();

      expect(plan1.equals(plan2)).toBe(true);
    });

    it('should NOT consider FREE and BASIC plans equal', () => {
      const freePlan = SubscriptionPlan.free();
      const basicPlan = SubscriptionPlan.basic();

      expect(freePlan.equals(basicPlan)).toBe(false);
    });
  });
});

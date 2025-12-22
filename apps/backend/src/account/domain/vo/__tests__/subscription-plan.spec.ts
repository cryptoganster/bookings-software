import { SubscriptionPlan } from '../subscription-plan';

describe('SubscriptionPlan Value Object', () => {
  describe('Factory Methods', () => {
    it('should create FREE plan with correct limits', () => {
      const plan = SubscriptionPlan.free();

      expect(plan.getName()).toBe('FREE');
      expect(plan.getMaxBusinesses()).toBe(1);
      expect(plan.getMaxAppointmentsPerMonth()).toBe(100);
      expect(plan.getPrice()).toBe(0);
    });

    it('should create BASIC plan with correct limits', () => {
      const plan = SubscriptionPlan.basic();

      expect(plan.getName()).toBe('BASIC');
      expect(plan.getMaxBusinesses()).toBe(1);
      expect(plan.getMaxAppointmentsPerMonth()).toBe(500);
      expect(plan.getPrice()).toBe(29);
    });

    it('should create PRO plan with correct limits', () => {
      const plan = SubscriptionPlan.pro();

      expect(plan.getName()).toBe('PRO');
      expect(plan.getMaxBusinesses()).toBe(3);
      expect(plan.getMaxAppointmentsPerMonth()).toBe(2000);
      expect(plan.getPrice()).toBe(79);
    });

    it('should create ENTERPRISE plan with correct limits', () => {
      const plan = SubscriptionPlan.enterprise();

      expect(plan.getName()).toBe('ENTERPRISE');
      expect(plan.getMaxBusinesses()).toBe(10);
      expect(plan.getMaxAppointmentsPerMonth()).toBe(10000);
      expect(plan.getPrice()).toBe(199);
    });
  });

  describe('canUpgradeTo()', () => {
    it('should return true for valid upgrades (FREE → BASIC)', () => {
      const freePlan = SubscriptionPlan.free();
      const basicPlan = SubscriptionPlan.basic();

      expect(freePlan.canUpgradeTo(basicPlan)).toBe(true);
    });

    it('should return true for valid upgrades (BASIC → PRO)', () => {
      const basicPlan = SubscriptionPlan.basic();
      const proPlan = SubscriptionPlan.pro();

      expect(basicPlan.canUpgradeTo(proPlan)).toBe(true);
    });

    it('should return true for valid upgrades (PRO → ENTERPRISE)', () => {
      const proPlan = SubscriptionPlan.pro();
      const enterprisePlan = SubscriptionPlan.enterprise();

      expect(proPlan.canUpgradeTo(enterprisePlan)).toBe(true);
    });

    it('should return true for valid upgrades (FREE → PRO)', () => {
      const freePlan = SubscriptionPlan.free();
      const proPlan = SubscriptionPlan.pro();

      expect(freePlan.canUpgradeTo(proPlan)).toBe(true);
    });

    it('should return false for downgrades (PRO → BASIC)', () => {
      const proPlan = SubscriptionPlan.pro();
      const basicPlan = SubscriptionPlan.basic();

      expect(proPlan.canUpgradeTo(basicPlan)).toBe(false);
    });

    it('should return false for downgrades (ENTERPRISE → PRO)', () => {
      const enterprisePlan = SubscriptionPlan.enterprise();
      const proPlan = SubscriptionPlan.pro();

      expect(enterprisePlan.canUpgradeTo(proPlan)).toBe(false);
    });

    it('should return false for same plan', () => {
      const freePlan1 = SubscriptionPlan.free();
      const freePlan2 = SubscriptionPlan.free();

      expect(freePlan1.canUpgradeTo(freePlan2)).toBe(false);
    });
  });

  describe('equals()', () => {
    it('should return true for same plan instances', () => {
      const plan1 = SubscriptionPlan.free();
      const plan2 = SubscriptionPlan.free();

      expect(plan1.equals(plan2)).toBe(true);
    });

    it('should return false for different plans', () => {
      const freePlan = SubscriptionPlan.free();
      const basicPlan = SubscriptionPlan.basic();

      expect(freePlan.equals(basicPlan)).toBe(false);
    });

    it('should return true for all plan types when compared to themselves', () => {
      const plans = [
        SubscriptionPlan.free(),
        SubscriptionPlan.basic(),
        SubscriptionPlan.pro(),
        SubscriptionPlan.enterprise(),
      ];

      plans.forEach((plan1) => {
        plans.forEach((plan2) => {
          if (plan1.getName() === plan2.getName()) {
            expect(plan1.equals(plan2)).toBe(true);
          } else {
            expect(plan1.equals(plan2)).toBe(false);
          }
        });
      });
    });
  });

  describe('getEqualityComponents()', () => {
    it('should return correct equality components', () => {
      const plan = SubscriptionPlan.free();
      const components = plan['getEqualityComponents']();

      expect(components).toEqual(['FREE']);
    });

    it('should return different components for different plans', () => {
      const freePlan = SubscriptionPlan.free();
      const basicPlan = SubscriptionPlan.basic();

      const freeComponents = freePlan['getEqualityComponents']();
      const basicComponents = basicPlan['getEqualityComponents']();

      expect(freeComponents).not.toEqual(basicComponents);
    });
  });
});

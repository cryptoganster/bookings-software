import { SubscriptionStatus } from '../subscription-status';

describe('SubscriptionStatus Value Object', () => {
  describe('Factory Methods', () => {
    it('should create ACTIVE status', () => {
      const status = SubscriptionStatus.active();

      expect(status.getValue()).toBe('ACTIVE');
      expect(status.isActive()).toBe(true);
      expect(status.isSuspended()).toBe(false);
      expect(status.isCancelled()).toBe(false);
    });

    it('should create SUSPENDED status', () => {
      const status = SubscriptionStatus.suspended();

      expect(status.getValue()).toBe('SUSPENDED');
      expect(status.isActive()).toBe(false);
      expect(status.isSuspended()).toBe(true);
      expect(status.isCancelled()).toBe(false);
    });

    it('should create CANCELLED status', () => {
      const status = SubscriptionStatus.cancelled();

      expect(status.getValue()).toBe('CANCELLED');
      expect(status.isActive()).toBe(false);
      expect(status.isSuspended()).toBe(false);
      expect(status.isCancelled()).toBe(true);
    });
  });

  describe('Query Methods', () => {
    it('should return true for isActive() only when status is ACTIVE', () => {
      expect(SubscriptionStatus.active().isActive()).toBe(true);
      expect(SubscriptionStatus.suspended().isActive()).toBe(false);
      expect(SubscriptionStatus.cancelled().isActive()).toBe(false);
    });

    it('should return true for isSuspended() only when status is SUSPENDED', () => {
      expect(SubscriptionStatus.active().isSuspended()).toBe(false);
      expect(SubscriptionStatus.suspended().isSuspended()).toBe(true);
      expect(SubscriptionStatus.cancelled().isSuspended()).toBe(false);
    });

    it('should return true for isCancelled() only when status is CANCELLED', () => {
      expect(SubscriptionStatus.active().isCancelled()).toBe(false);
      expect(SubscriptionStatus.suspended().isCancelled()).toBe(false);
      expect(SubscriptionStatus.cancelled().isCancelled()).toBe(true);
    });
  });

  describe('equals()', () => {
    it('should return true for same status instances', () => {
      const status1 = SubscriptionStatus.active();
      const status2 = SubscriptionStatus.active();

      expect(status1.equals(status2)).toBe(true);
    });

    it('should return false for different statuses', () => {
      const activeStatus = SubscriptionStatus.active();
      const suspendedStatus = SubscriptionStatus.suspended();

      expect(activeStatus.equals(suspendedStatus)).toBe(false);
    });

    it('should return true for all status types when compared to themselves', () => {
      const statuses = [
        SubscriptionStatus.active(),
        SubscriptionStatus.suspended(),
        SubscriptionStatus.cancelled(),
      ];

      statuses.forEach((status1) => {
        statuses.forEach((status2) => {
          if (status1.getValue() === status2.getValue()) {
            expect(status1.equals(status2)).toBe(true);
          } else {
            expect(status1.equals(status2)).toBe(false);
          }
        });
      });
    });
  });

  describe('getEqualityComponents()', () => {
    it('should return correct equality components for ACTIVE', () => {
      const status = SubscriptionStatus.active();
      const components = status['getEqualityComponents']();

      expect(components).toEqual(['ACTIVE']);
    });

    it('should return correct equality components for SUSPENDED', () => {
      const status = SubscriptionStatus.suspended();
      const components = status['getEqualityComponents']();

      expect(components).toEqual(['SUSPENDED']);
    });

    it('should return correct equality components for CANCELLED', () => {
      const status = SubscriptionStatus.cancelled();
      const components = status['getEqualityComponents']();

      expect(components).toEqual(['CANCELLED']);
    });

    it('should return different components for different statuses', () => {
      const activeStatus = SubscriptionStatus.active();
      const suspendedStatus = SubscriptionStatus.suspended();

      const activeComponents = activeStatus['getEqualityComponents']();
      const suspendedComponents = suspendedStatus['getEqualityComponents']();

      expect(activeComponents).not.toEqual(suspendedComponents);
    });
  });
});

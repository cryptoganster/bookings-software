import { describe, it, expect } from '@jest/globals';
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
    it('isActive() should return true only for ACTIVE status', () => {
      expect(SubscriptionStatus.active().isActive()).toBe(true);
      expect(SubscriptionStatus.suspended().isActive()).toBe(false);
      expect(SubscriptionStatus.cancelled().isActive()).toBe(false);
    });

    it('isSuspended() should return true only for SUSPENDED status', () => {
      expect(SubscriptionStatus.active().isSuspended()).toBe(false);
      expect(SubscriptionStatus.suspended().isSuspended()).toBe(true);
      expect(SubscriptionStatus.cancelled().isSuspended()).toBe(false);
    });

    it('isCancelled() should return true only for CANCELLED status', () => {
      expect(SubscriptionStatus.active().isCancelled()).toBe(false);
      expect(SubscriptionStatus.suspended().isCancelled()).toBe(false);
      expect(SubscriptionStatus.cancelled().isCancelled()).toBe(true);
    });
  });

  describe('Equality', () => {
    it('should consider two ACTIVE statuses equal', () => {
      const status1 = SubscriptionStatus.active();
      const status2 = SubscriptionStatus.active();

      expect(status1.equals(status2)).toBe(true);
    });

    it('should consider two SUSPENDED statuses equal', () => {
      const status1 = SubscriptionStatus.suspended();
      const status2 = SubscriptionStatus.suspended();

      expect(status1.equals(status2)).toBe(true);
    });

    it('should consider two CANCELLED statuses equal', () => {
      const status1 = SubscriptionStatus.cancelled();
      const status2 = SubscriptionStatus.cancelled();

      expect(status1.equals(status2)).toBe(true);
    });

    it('should NOT consider ACTIVE and SUSPENDED statuses equal', () => {
      const activeStatus = SubscriptionStatus.active();
      const suspendedStatus = SubscriptionStatus.suspended();

      expect(activeStatus.equals(suspendedStatus)).toBe(false);
    });

    it('should NOT consider SUSPENDED and CANCELLED statuses equal', () => {
      const suspendedStatus = SubscriptionStatus.suspended();
      const cancelledStatus = SubscriptionStatus.cancelled();

      expect(suspendedStatus.equals(cancelledStatus)).toBe(false);
    });
  });
});

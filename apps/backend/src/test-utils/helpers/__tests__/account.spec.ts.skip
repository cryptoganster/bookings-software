/**
 * Unit Tests for Account BC Test Helpers
 *
 * Tests the TestAccountHelper class and standalone functions for Account BC.
 */

import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TestAccountHelper, createBusinessOwnerInDb } from '../account';
import { SubscriptionPlan } from '../types';

// Mock supertest
let mockRequest: any;

jest.mock('supertest', () => {
  return jest.fn((app: any) => mockRequest);
});

// Mock @shared/vo/uuid
jest.mock('@shared/vo/uuid', () => ({
  UUID: {
    generate: jest.fn(() => ({
      getValue: () => 'test-uuid-123',
    })),
  },
}));

describe('TestAccountHelper', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let helper: TestAccountHelper;

  beforeEach(() => {
    // Mock DataSource
    dataSource = {
      query: jest.fn(),
    } as unknown as DataSource;

    // Mock INestApplication
    app = {
      getHttpServer: jest.fn(() => 'mock-server'),
      get: jest.fn((token) => {
        if (token === DataSource) {
          return dataSource;
        }
        return null;
      }),
    } as unknown as INestApplication;

    // Setup supertest mock chain
    mockRequest = {
      get: jest.fn().mockReturnThis(),
      post: jest.fn().mockReturnThis(),
      put: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      expect: jest.fn().mockReturnThis(),
    };

    helper = new TestAccountHelper(app);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getProfile', () => {
    it('should get BusinessOwner profile successfully', async () => {
      // Arrange
      const token = 'jwt-token-123';
      const expectedProfile = {
        id: 'business-owner-id',
        userId: 'user-id',
        subscriptionPlan: 'FREE',
        subscriptionStatus: 'ACTIVE',
        onboardingCompleted: false,
        maxBusinesses: 1,
        maxAppointmentsPerMonth: 100,
        price: 0,
      };

      mockRequest.expect.mockResolvedValue({
        body: expectedProfile,
      });

      // Act
      const profile = await helper.getProfile(token);

      // Assert
      expect(profile).toEqual(expectedProfile);
      expect(mockRequest.get).toHaveBeenCalledWith('/api/account/profile');
      expect(mockRequest.set).toHaveBeenCalledWith('Authorization', `Bearer ${token}`);
      expect(mockRequest.expect).toHaveBeenCalledWith(200);
    });

    it('should throw error on 401 Unauthorized', async () => {
      // Arrange
      const token = 'invalid-token';

      mockRequest.expect.mockRejectedValue({ status: 401 });

      // Act & Assert
      await expect(helper.getProfile(token)).rejects.toThrow('Get profile failed: Unauthorized');
    });

    it('should throw error on 404 Not Found', async () => {
      // Arrange
      const token = 'jwt-token-123';

      mockRequest.expect.mockRejectedValue({ status: 404 });

      // Act & Assert
      await expect(helper.getProfile(token)).rejects.toThrow(
        'Get profile failed: BusinessOwner not found',
      );
    });
  });

  describe('completeOnboarding', () => {
    it('should complete onboarding successfully', async () => {
      // Arrange
      const token = 'jwt-token-123';

      mockRequest.expect.mockResolvedValue({});

      // Act
      await helper.completeOnboarding(token);

      // Assert
      expect(mockRequest.post).toHaveBeenCalledWith('/api/account/onboarding/complete');
      expect(mockRequest.set).toHaveBeenCalledWith('Authorization', `Bearer ${token}`);
      expect(mockRequest.expect).toHaveBeenCalledWith(201);
    });

    it('should throw error on 401 Unauthorized', async () => {
      // Arrange
      const token = 'invalid-token';

      mockRequest.expect.mockRejectedValue({ status: 401 });

      // Act & Assert
      await expect(helper.completeOnboarding(token)).rejects.toThrow(
        'Complete onboarding failed: Unauthorized',
      );
    });

    it('should throw error on 400 Bad Request (already completed)', async () => {
      // Arrange
      const token = 'jwt-token-123';

      mockRequest.expect.mockRejectedValue({ status: 400 });

      // Act & Assert
      await expect(helper.completeOnboarding(token)).rejects.toThrow(
        'Complete onboarding failed: Onboarding already completed',
      );
    });
  });

  describe('upgradeSubscription', () => {
    it('should upgrade subscription successfully', async () => {
      // Arrange
      const token = 'jwt-token-123';
      const newPlan = SubscriptionPlan.PRO;

      mockRequest.expect.mockResolvedValue({});

      // Act
      await helper.upgradeSubscription(token, newPlan);

      // Assert
      expect(mockRequest.put).toHaveBeenCalledWith('/api/account/subscription/upgrade');
      expect(mockRequest.set).toHaveBeenCalledWith('Authorization', `Bearer ${token}`);
      expect(mockRequest.send).toHaveBeenCalledWith({ newPlan });
      expect(mockRequest.expect).toHaveBeenCalledWith(200);
    });

    it('should throw error on 401 Unauthorized', async () => {
      // Arrange
      const token = 'invalid-token';
      const newPlan = SubscriptionPlan.PRO;

      mockRequest.expect.mockRejectedValue({ status: 401 });

      // Act & Assert
      await expect(helper.upgradeSubscription(token, newPlan)).rejects.toThrow(
        'Upgrade subscription failed: Unauthorized',
      );
    });

    it('should throw error on 400 Bad Request (invalid plan)', async () => {
      // Arrange
      const token = 'jwt-token-123';
      const newPlan = SubscriptionPlan.FREE;

      mockRequest.expect.mockRejectedValue({ status: 400 });

      // Act & Assert
      await expect(helper.upgradeSubscription(token, newPlan)).rejects.toThrow(
        'Upgrade subscription failed: Invalid plan or already on this plan',
      );
    });
  });

  describe('getSubscription', () => {
    it('should get subscription information successfully', async () => {
      // Arrange
      const token = 'jwt-token-123';
      const expectedSubscription = {
        plan: 'FREE',
        status: 'ACTIVE',
        maxBusinesses: 1,
        currentBusinessCount: 0,
        maxAppointmentsPerMonth: 100,
        price: 0,
      };

      mockRequest.expect.mockResolvedValue({
        body: expectedSubscription,
      });

      // Act
      const subscription = await helper.getSubscription(token);

      // Assert
      expect(subscription).toEqual(expectedSubscription);
      expect(mockRequest.get).toHaveBeenCalledWith('/api/account/subscription');
      expect(mockRequest.set).toHaveBeenCalledWith('Authorization', `Bearer ${token}`);
      expect(mockRequest.expect).toHaveBeenCalledWith(200);
    });

    it('should throw error on 401 Unauthorized', async () => {
      // Arrange
      const token = 'invalid-token';

      mockRequest.expect.mockRejectedValue({ status: 401 });

      // Act & Assert
      await expect(helper.getSubscription(token)).rejects.toThrow(
        'Get subscription failed: Unauthorized',
      );
    });
  });

  describe('cleanupBusinessOwners', () => {
    it('should cleanup all business owners', async () => {
      // Arrange
      (dataSource.query as jest.Mock).mockResolvedValue(undefined);

      // Manually add a business owner to the internal array
      (helper as any).createdBusinessOwners = ['business-owner-id-1', 'business-owner-id-2'];

      // Act
      await helper.cleanupBusinessOwners();

      // Assert
      expect(dataSource.query).toHaveBeenCalledWith('DELETE FROM business_owners WHERE id = $1', [
        'business-owner-id-1',
      ]);
      expect(dataSource.query).toHaveBeenCalledWith('DELETE FROM business_owners WHERE id = $1', [
        'business-owner-id-2',
      ]);
      expect(dataSource.query).toHaveBeenCalledTimes(2);
    });

    it('should handle cleanup errors gracefully', async () => {
      // Arrange
      (helper as any).createdBusinessOwners = ['business-owner-id-1'];
      (dataSource.query as jest.Mock).mockRejectedValue(new Error('Database error'));

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      // Act
      await helper.cleanupBusinessOwners();

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalledWith('Cleanup completed with 1 errors');

      consoleErrorSpy.mockRestore();
      consoleWarnSpy.mockRestore();
    });

    it('should clear business owners array after cleanup', async () => {
      // Arrange
      (helper as any).createdBusinessOwners = ['business-owner-id-1'];
      (dataSource.query as jest.Mock).mockResolvedValue(undefined);

      // Act
      await helper.cleanupBusinessOwners();
      await helper.cleanupBusinessOwners(); // Second cleanup should do nothing

      // Assert - only 1 query from first cleanup
      expect(dataSource.query).toHaveBeenCalledTimes(1);
    });
  });
});

describe('Standalone Functions', () => {
  describe('createBusinessOwnerInDb', () => {
    let dataSource: DataSource;

    beforeEach(() => {
      dataSource = {
        query: jest.fn().mockResolvedValue(undefined),
      } as unknown as DataSource;
    });

    it('should create BusinessOwner with default values', async () => {
      // Act
      const businessOwnerId = await createBusinessOwnerInDb(dataSource);

      // Assert
      expect(businessOwnerId).toBe('test-uuid-123');
      expect(dataSource.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO business_owners'),
        expect.arrayContaining([
          'test-uuid-123', // id
          'test-uuid-123', // userId (generated)
          SubscriptionPlan.FREE,
          'ACTIVE',
          false, // onboardingCompleted
        ]),
      );
    });

    it('should create BusinessOwner with custom businessOwnerId', async () => {
      // Arrange
      const customBusinessOwnerId = 'custom-business-owner-id';

      // Act
      const businessOwnerId = await createBusinessOwnerInDb(dataSource, customBusinessOwnerId);

      // Assert
      expect(businessOwnerId).toBe(customBusinessOwnerId);
      expect(dataSource.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO business_owners'),
        expect.arrayContaining([customBusinessOwnerId]),
      );
    });

    it('should create BusinessOwner with custom userId', async () => {
      // Arrange
      const customUserId = 'custom-user-id';

      // Act
      await createBusinessOwnerInDb(dataSource, undefined, customUserId);

      // Assert
      expect(dataSource.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO business_owners'),
        expect.arrayContaining([
          expect.any(String), // businessOwnerId
          customUserId,
        ]),
      );
    });

    it('should create BusinessOwner with custom options', async () => {
      // Arrange
      const options = {
        subscriptionPlan: SubscriptionPlan.PRO,
        subscriptionStatus: 'SUSPENDED' as const,
        onboardingCompleted: true,
      };

      // Act
      await createBusinessOwnerInDb(dataSource, undefined, undefined, options);

      // Assert
      expect(dataSource.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO business_owners'),
        expect.arrayContaining([
          expect.any(String), // businessOwnerId
          expect.any(String), // userId
          SubscriptionPlan.PRO,
          'SUSPENDED',
          true,
        ]),
      );
    });

    it('should create BusinessOwner with ENTERPRISE plan', async () => {
      // Arrange
      const options = {
        subscriptionPlan: SubscriptionPlan.ENTERPRISE,
      };

      // Act
      await createBusinessOwnerInDb(dataSource, undefined, undefined, options);

      // Assert
      expect(dataSource.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO business_owners'),
        expect.arrayContaining([
          expect.any(String),
          expect.any(String),
          SubscriptionPlan.ENTERPRISE,
        ]),
      );
    });

    it('should handle database errors', async () => {
      // Arrange
      const dbError = new Error('Database connection failed');
      (dataSource.query as jest.Mock).mockRejectedValue(dbError);

      // Act & Assert
      await expect(createBusinessOwnerInDb(dataSource)).rejects.toThrow(
        'Database connection failed',
      );
    });
  });
});

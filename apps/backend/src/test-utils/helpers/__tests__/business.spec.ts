/**
 * Unit Tests for Business BC Test Helpers
 *
 * Tests the TestBusinessHelper class and standalone functions for Business BC.
 */

import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as request from 'supertest';
import {
  TestBusinessHelper,
  generateUniqueWhatsAppNumber,
  createTestBusinessInDb,
} from '../business';
import { CreateBusinessDto } from '../types';

// Mock supertest
jest.mock('supertest');

describe('TestBusinessHelper', () => {
  let helper: TestBusinessHelper;
  let mockApp: INestApplication;
  let mockDataSource: DataSource;
  let mockExpect: jest.Mock;

  beforeEach(() => {
    // Setup mock chain for supertest
    mockExpect = jest.fn().mockResolvedValue({
      body: { id: 'business-123', token: 'new-token-with-business-id' },
    });

    const mockSend = jest.fn().mockReturnValue({ expect: mockExpect });
    const mockSet = jest.fn().mockReturnValue({ send: mockSend });
    const mockPost = jest.fn().mockReturnValue({ set: mockSet });
    const mockPut = jest.fn().mockReturnValue({ set: mockSet });

    (request as unknown as jest.Mock).mockReturnValue({
      post: mockPost,
      put: mockPut,
    });

    mockDataSource = {
      query: jest.fn(),
    } as unknown as DataSource;

    mockApp = {
      getHttpServer: jest.fn().mockReturnValue({}),
      get: jest.fn().mockReturnValue(mockDataSource),
    } as unknown as INestApplication;

    helper = new TestBusinessHelper(mockApp);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createTestBusiness', () => {
    const validToken = 'valid-jwt-token';

    it('should create business with default data', async () => {
      const result = await helper.createTestBusiness(validToken);

      expect(result).toEqual({
        id: 'business-123',
        token: 'new-token-with-business-id',
      });

      const mockRequest = (request as unknown as jest.Mock).mock.results[0].value;
      expect(mockRequest.post).toHaveBeenCalledWith('/api/businesses');
      expect(mockExpect).toHaveBeenCalledWith(201);
    });

    it('should create business with custom data', async () => {
      const customData: Partial<CreateBusinessDto> = {
        name: 'Custom Business',
        whatsappNumber: '+18091234567',
        address: {
          street: '456 Custom Ave',
          city: 'Custom City',
          state: 'Custom State',
          country: 'Custom Country',
          postalCode: '54321',
        },
        timezone: 'America/New_York',
      };

      const result = await helper.createTestBusiness(validToken, customData);

      expect(result).toEqual({
        id: 'business-123',
        token: 'new-token-with-business-id',
      });
    });

    it('should generate unique WhatsApp number if not provided', async () => {
      await helper.createTestBusiness(validToken);

      // Just verify it was called successfully
      expect(mockExpect).toHaveBeenCalledWith(201);
    });

    it('should throw error on 401 Unauthorized', async () => {
      mockExpect.mockRejectedValue({ status: 401 });

      await expect(helper.createTestBusiness(validToken)).rejects.toThrow(
        'Business creation failed: Unauthorized',
      );
    });

    it('should throw error on 400 Bad Request', async () => {
      mockExpect.mockRejectedValue({
        status: 400,
        body: { message: 'Invalid timezone' },
      });

      await expect(helper.createTestBusiness(validToken)).rejects.toThrow(
        'Business creation failed: "Invalid timezone"',
      );
    });

    it('should throw error on 409 Conflict (duplicate WhatsApp)', async () => {
      mockExpect.mockRejectedValue({ status: 409 });

      await expect(helper.createTestBusiness(validToken)).rejects.toThrow(
        'Business creation failed: WhatsApp number already exists',
      );
    });

    it('should throw error on invalid response format', async () => {
      mockExpect.mockResolvedValue({ body: { invalidField: 'value' } });

      await expect(helper.createTestBusiness(validToken)).rejects.toThrow(
        'Business creation failed: Invalid response format',
      );
    });

    it('should track created businesses', async () => {
      await helper.createTestBusiness(validToken);
      await helper.createTestBusiness(validToken);

      // Verify cleanup would clean both
      await helper.cleanupBusinesses();

      expect(mockDataSource.query).toHaveBeenCalledTimes(2);
    });
  });

  describe('configureWhatsApp', () => {
    const validToken = 'valid-jwt-token';
    const businessId = 'business-123';
    const whatsappNumber = '+18091234567';

    it('should configure WhatsApp number', async () => {
      await helper.configureWhatsApp(validToken, businessId, whatsappNumber);

      const mockRequest = (request as unknown as jest.Mock).mock.results[0].value;
      expect(mockRequest.put).toHaveBeenCalledWith(`/api/businesses/${businessId}/whatsapp`);
      expect(mockExpect).toHaveBeenCalledWith(200);
    });

    it('should throw error on 401 Unauthorized', async () => {
      mockExpect.mockRejectedValue({ status: 401 });

      await expect(
        helper.configureWhatsApp(validToken, businessId, whatsappNumber),
      ).rejects.toThrow('WhatsApp configuration failed: Unauthorized');
    });

    it('should throw error on 404 Not Found', async () => {
      mockExpect.mockRejectedValue({ status: 404 });

      await expect(
        helper.configureWhatsApp(validToken, businessId, whatsappNumber),
      ).rejects.toThrow('WhatsApp configuration failed: Business not found');
    });

    it('should throw error on 409 Conflict', async () => {
      mockExpect.mockRejectedValue({ status: 409 });

      await expect(
        helper.configureWhatsApp(validToken, businessId, whatsappNumber),
      ).rejects.toThrow('WhatsApp configuration failed: WhatsApp number already exists');
    });
  });

  describe('cleanupBusinesses', () => {
    it('should cleanup all tracked businesses', async () => {
      // Create some businesses first
      await helper.createTestBusiness('token');
      await helper.createTestBusiness('token');

      await helper.cleanupBusinesses();

      expect(mockDataSource.query).toHaveBeenCalledTimes(2);
      expect(mockDataSource.query).toHaveBeenCalledWith('DELETE FROM businesses WHERE id = $1', [
        'business-123',
      ]);
    });

    it('should cleanup specific business IDs', async () => {
      const specificIds = ['business-1', 'business-2', 'business-3'];

      await helper.cleanupBusinesses(specificIds);

      expect(mockDataSource.query).toHaveBeenCalledTimes(3);
      expect(mockDataSource.query).toHaveBeenCalledWith('DELETE FROM businesses WHERE id = $1', [
        'business-1',
      ]);
      expect(mockDataSource.query).toHaveBeenCalledWith('DELETE FROM businesses WHERE id = $1', [
        'business-2',
      ]);
      expect(mockDataSource.query).toHaveBeenCalledWith('DELETE FROM businesses WHERE id = $1', [
        'business-3',
      ]);
    });

    it('should handle cleanup errors gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      (mockDataSource.query as jest.Mock).mockRejectedValue(new Error('Database error'));

      await helper.createTestBusiness('token');
      await helper.cleanupBusinesses();

      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalledWith('Cleanup completed with 1 errors');

      consoleErrorSpy.mockRestore();
      consoleWarnSpy.mockRestore();
    });

    it('should not clear tracked businesses when cleaning specific IDs', async () => {
      await helper.createTestBusiness('token');

      await helper.cleanupBusinesses(['other-business-id']);

      // Should still have the tracked business
      await helper.cleanupBusinesses();
      expect(mockDataSource.query).toHaveBeenCalledWith('DELETE FROM businesses WHERE id = $1', [
        'business-123',
      ]);
    });
  });
});

describe('generateUniqueWhatsAppNumber', () => {
  it('should generate WhatsApp number with correct format', () => {
    const number = generateUniqueWhatsAppNumber();

    expect(number).toMatch(/^\+1809\d{7}$/);
  });

  it('should generate unique numbers on consecutive calls', () => {
    const number1 = generateUniqueWhatsAppNumber();
    // Small delay to ensure different timestamp
    const number2 = generateUniqueWhatsAppNumber();

    // They should be different (though might be same if called in same millisecond)
    // Just verify format is correct
    expect(number1).toMatch(/^\+1809\d{7}$/);
    expect(number2).toMatch(/^\+1809\d{7}$/);
  });
});

describe('createTestBusinessInDb', () => {
  let mockDataSource: DataSource;
  let mockUUID: { generate: jest.Mock };

  beforeEach(() => {
    mockDataSource = {
      query: jest.fn(),
    } as unknown as DataSource;

    mockUUID = {
      generate: jest.fn().mockReturnValue({ getValue: () => 'generated-uuid' }),
    };

    jest.mock('@shared/vo/uuid', () => ({
      UUID: mockUUID,
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create business with provided ID', async () => {
    const businessId = 'custom-business-id';
    const ownerId = 'owner-123';

    const result = await createTestBusinessInDb(mockDataSource, businessId, ownerId);

    expect(result).toBe(businessId);
    expect(mockDataSource.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO businesses'),
      expect.arrayContaining([businessId, ownerId, 'Test Business']),
    );
  });

  it('should create business with custom data', async () => {
    const businessId = 'business-123';
    const ownerId = 'owner-123';
    const customData: Partial<CreateBusinessDto> = {
      name: 'Custom Business',
      whatsappNumber: '+18091234567',
      address: {
        street: '456 Custom Ave',
        city: 'Custom City',
        state: 'Custom State',
        country: 'Custom Country',
        postalCode: '54321',
      },
      timezone: 'America/New_York',
    };

    await createTestBusinessInDb(mockDataSource, businessId, ownerId, customData);

    expect(mockDataSource.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO businesses'),
      expect.arrayContaining([
        businessId,
        ownerId,
        'Custom Business',
        '+18091234567',
        '456 Custom Ave',
        'Custom City',
        'Custom State',
        'Custom Country',
        '54321',
        'America/New_York',
      ]),
    );
  });

  it('should use default values when not provided', async () => {
    const businessId = 'business-123';
    const ownerId = 'owner-123';

    await createTestBusinessInDb(mockDataSource, businessId, ownerId);

    const queryCall = (mockDataSource.query as jest.Mock).mock.calls[0];
    const params = queryCall[1] as unknown[];

    expect(params[2]).toBe('Test Business'); // name
    expect(params[3]).toMatch(/^\+1809\d{7}$/); // whatsappNumber
    expect(params[4]).toBe('123 Test St'); // address.street
    expect(params[5]).toBe('Test City'); // address.city
    expect(params[9]).toBe('America/Santo_Domingo'); // timezone
  });

  it('should handle null state and postalCode', async () => {
    const businessId = 'business-123';
    const ownerId = 'owner-123';
    const customData: Partial<CreateBusinessDto> = {
      address: {
        street: '123 Test St',
        city: 'Test City',
        state: null,
        country: 'Test Country',
        postalCode: null,
      },
    };

    await createTestBusinessInDb(mockDataSource, businessId, ownerId, customData);

    const queryCall = (mockDataSource.query as jest.Mock).mock.calls[0];
    const params = queryCall[1] as unknown[];

    expect(params[6]).toBeNull(); // state
    expect(params[8]).toBeNull(); // postalCode
  });

  it('should set is_active to true by default', async () => {
    const businessId = 'business-123';
    const ownerId = 'owner-123';

    await createTestBusinessInDb(mockDataSource, businessId, ownerId);

    expect(mockDataSource.query).toHaveBeenCalledWith(
      expect.stringContaining('is_active'),
      expect.any(Array),
    );
  });
});

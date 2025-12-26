/**
 * Unit Tests for Auth BC Test Helpers
 *
 * Tests the TestAuthHelper class and standalone functions for Auth BC.
 */

import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TestAuthHelper, generateTestEmail, createTestUserInDb } from '../auth';
import { UserRole } from '../types';

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

describe('TestAuthHelper', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let helper: TestAuthHelper;

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
      post: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      expect: jest.fn().mockReturnThis(),
    };

    helper = new TestAuthHelper(app);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should login successfully and return token', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'Test123!@#';
      const expectedToken = 'jwt-token-123';

      mockRequest.expect.mockResolvedValue({
        body: { token: expectedToken },
      });

      // Act
      const token = await helper.login(email, password);

      // Assert
      expect(token).toBe(expectedToken);
      expect(mockRequest.post).toHaveBeenCalledWith('/api/auth/login');
      expect(mockRequest.send).toHaveBeenCalledWith({ email, password });
      expect(mockRequest.expect).toHaveBeenCalledWith(201);
    });

    it('should throw error on 401 Unauthorized', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'wrong-password';

      mockRequest.expect.mockRejectedValue({ status: 401 });

      // Act & Assert
      await expect(helper.login(email, password)).rejects.toThrow(
        'Authentication failed: Invalid credentials',
      );
    });

    it('should throw error on 500 Server Error', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'Test123!@#';

      mockRequest.expect.mockRejectedValue({ status: 500 });

      // Act & Assert
      await expect(helper.login(email, password)).rejects.toThrow(
        'Authentication failed: Server error',
      );
    });
  });

  describe('register', () => {
    it('should register successfully and return token and userId', async () => {
      // Arrange
      const userData = {
        email: 'test@example.com',
        password: 'Test123!@#',
        name: 'Test User',
        initialRole: UserRole.BUSINESS_OWNER,
      };
      const expectedToken = 'jwt-token-123';
      const expectedUserId = 'user-id-123';

      mockRequest.expect.mockResolvedValue({
        body: { token: expectedToken, userId: expectedUserId },
      });

      // Act
      const result = await helper.register(userData);

      // Assert
      expect(result.token).toBe(expectedToken);
      expect(result.userId).toBe(expectedUserId);
      expect(mockRequest.post).toHaveBeenCalledWith('/api/auth/register');
      expect(mockRequest.send).toHaveBeenCalledWith(userData);
    });

    it('should throw error on 400 Bad Request', async () => {
      // Arrange
      const userData = {
        email: 'invalid-email',
        password: 'weak',
        name: 'Test User',
        initialRole: UserRole.BUSINESS_OWNER,
      };

      mockRequest.expect.mockRejectedValue({
        status: 400,
        body: { message: 'Invalid email format' },
      });

      // Act & Assert
      await expect(helper.register(userData)).rejects.toThrow('Registration failed');
    });

    it('should throw error on 409 Conflict (email exists)', async () => {
      // Arrange
      const userData = {
        email: 'existing@example.com',
        password: 'Test123!@#',
        name: 'Test User',
        initialRole: UserRole.BUSINESS_OWNER,
      };

      mockRequest.expect.mockRejectedValue({ status: 409 });

      // Act & Assert
      await expect(helper.register(userData)).rejects.toThrow(
        'Registration failed: Email already exists',
      );
    });

    it('should throw error when response is missing token', async () => {
      // Arrange
      const userData = {
        email: 'test@example.com',
        password: 'Test123!@#',
        name: 'Test User',
        initialRole: UserRole.BUSINESS_OWNER,
      };

      mockRequest.expect.mockResolvedValue({
        body: { userId: 'user-id-123' }, // Missing token
      });

      // Act & Assert
      await expect(helper.register(userData)).rejects.toThrow(
        'Registration failed: Invalid response format',
      );
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      // Arrange
      const refreshToken = 'refresh-token-123';
      const expectedNewToken = 'new-jwt-token-456';

      mockRequest.expect.mockResolvedValue({
        body: { token: expectedNewToken },
      });

      // Act
      const newToken = await helper.refreshToken(refreshToken);

      // Assert
      expect(newToken).toBe(expectedNewToken);
      expect(mockRequest.post).toHaveBeenCalledWith('/api/auth/refresh');
      expect(mockRequest.send).toHaveBeenCalledWith({ refreshToken });
    });

    it('should throw error on 401 Unauthorized (invalid refresh token)', async () => {
      // Arrange
      const refreshToken = 'invalid-refresh-token';

      mockRequest.expect.mockRejectedValue({ status: 401 });

      // Act & Assert
      await expect(helper.refreshToken(refreshToken)).rejects.toThrow(
        'Token refresh failed: Invalid refresh token',
      );
    });
  });

  describe('createTestUser', () => {
    it('should create test user with BUSINESS_OWNER role', async () => {
      // Arrange
      const expectedToken = 'jwt-token-123';
      const expectedUserId = 'user-id-123';

      mockRequest.expect.mockResolvedValue({
        body: { token: expectedToken, userId: expectedUserId },
      });

      // Act
      const testUser = await helper.createTestUser(UserRole.BUSINESS_OWNER);

      // Assert
      expect(testUser.id).toBe(expectedUserId);
      expect(testUser.token).toBe(expectedToken);
      expect(testUser.role).toBe(UserRole.BUSINESS_OWNER);
      expect(testUser.email).toContain('test-');
      expect(testUser.email).toContain('@example.com');
      expect(testUser.password).toBe('Test123!@#');
    });

    it('should create test user with custom name', async () => {
      // Arrange
      const customName = 'Custom Test User';
      const expectedToken = 'jwt-token-123';
      const expectedUserId = 'user-id-123';

      mockRequest.expect.mockResolvedValue({
        body: { token: expectedToken, userId: expectedUserId },
      });

      // Act
      const testUser = await helper.createTestUser(UserRole.CUSTOMER, { name: customName });

      // Assert
      expect(testUser.role).toBe(UserRole.CUSTOMER);
    });

    it('should track created test users for cleanup', async () => {
      // Arrange
      mockRequest.expect
        .mockResolvedValueOnce({
          body: { token: 'token-1', userId: 'user-1' },
        })
        .mockResolvedValueOnce({
          body: { token: 'token-2', userId: 'user-2' },
        });

      // Act
      await helper.createTestUser(UserRole.BUSINESS_OWNER);
      await helper.createTestUser(UserRole.CUSTOMER);

      // Assert - verify cleanup will be called for both users
      (dataSource.query as jest.Mock).mockResolvedValue(undefined);
      await helper.cleanupTestUsers();
      expect(dataSource.query).toHaveBeenCalledTimes(4); // 2 users * 2 queries each
    });
  });

  describe('createAdmin', () => {
    it('should create admin user', async () => {
      // Arrange
      const expectedToken = 'jwt-token-123';
      const expectedUserId = 'admin-id-123';

      mockRequest.expect.mockResolvedValue({
        body: { token: expectedToken, userId: expectedUserId },
      });

      // Act
      const admin = await helper.createAdmin();

      // Assert
      expect(admin.role).toBe(UserRole.ADMIN);
      expect(admin.id).toBe(expectedUserId);
      expect(admin.token).toBe(expectedToken);
    });

    it('should create admin with custom name', async () => {
      // Arrange
      const customName = 'Admin User';
      mockRequest.expect.mockResolvedValue({
        body: { token: 'token', userId: 'admin-id' },
      });

      // Act
      const admin = await helper.createAdmin({ name: customName });

      // Assert
      expect(admin.role).toBe(UserRole.ADMIN);
    });
  });

  describe('cleanupTestUsers', () => {
    it('should cleanup all test users', async () => {
      // Arrange
      mockRequest.expect.mockResolvedValue({
        body: { token: 'token', userId: 'user-id' },
      });

      await helper.createTestUser(UserRole.BUSINESS_OWNER);
      (dataSource.query as jest.Mock).mockResolvedValue(undefined);

      // Act
      await helper.cleanupTestUsers();

      // Assert
      expect(dataSource.query).toHaveBeenCalledWith(
        'DELETE FROM business_owners WHERE user_id = $1',
        ['user-id'],
      );
      expect(dataSource.query).toHaveBeenCalledWith('DELETE FROM users WHERE id = $1', ['user-id']);
    });

    it('should handle cleanup errors gracefully', async () => {
      // Arrange
      mockRequest.expect.mockResolvedValue({
        body: { token: 'token', userId: 'user-id' },
      });

      await helper.createTestUser(UserRole.BUSINESS_OWNER);
      (dataSource.query as jest.Mock).mockRejectedValue(new Error('Database error'));

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      // Act
      await helper.cleanupTestUsers();

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalledWith('Cleanup completed with 1 errors');

      consoleErrorSpy.mockRestore();
      consoleWarnSpy.mockRestore();
    });

    it('should clear test users array after cleanup', async () => {
      // Arrange
      mockRequest.expect.mockResolvedValue({
        body: { token: 'token', userId: 'user-id' },
      });

      await helper.createTestUser(UserRole.BUSINESS_OWNER);
      (dataSource.query as jest.Mock).mockResolvedValue(undefined);

      // Act
      await helper.cleanupTestUsers();
      await helper.cleanupTestUsers(); // Second cleanup should do nothing

      // Assert - only 2 queries from first cleanup
      expect(dataSource.query).toHaveBeenCalledTimes(2);
    });
  });
});

describe('Standalone Functions', () => {
  describe('generateTestEmail', () => {
    it('should generate unique email with timestamp', () => {
      // Act
      const email1 = generateTestEmail();
      const email2 = generateTestEmail();

      // Assert
      expect(email1).toMatch(/^test-\d+-[a-z0-9]+@example\.com$/);
      expect(email2).toMatch(/^test-\d+-[a-z0-9]+@example\.com$/);
      expect(email1).not.toBe(email2); // Should be unique
    });

    it('should generate email with correct format', () => {
      // Act
      const email = generateTestEmail();

      // Assert
      expect(email).toContain('test-');
      expect(email).toContain('@example.com');
      expect(email.split('@')[0]).toContain('-'); // Has timestamp and random parts
    });
  });

  describe('createTestUserInDb', () => {
    let dataSource: DataSource;

    beforeEach(() => {
      dataSource = {
        query: jest.fn().mockResolvedValue(undefined),
      } as unknown as DataSource;
    });

    it('should create user with default values', async () => {
      // Act
      const userId = await createTestUserInDb(dataSource);

      // Assert
      expect(userId).toBe('test-uuid-123');
      expect(dataSource.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO users'),
        expect.arrayContaining([
          'test-uuid-123',
          expect.stringContaining('test-'),
          'Test123!@#',
          'Test User',
          JSON.stringify([UserRole.BUSINESS_OWNER]),
          true,
          true,
        ]),
      );
    });

    it('should create user with custom userId', async () => {
      // Arrange
      const customUserId = 'custom-user-id-456';

      // Act
      const userId = await createTestUserInDb(dataSource, customUserId);

      // Assert
      expect(userId).toBe(customUserId);
      expect(dataSource.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO users'),
        expect.arrayContaining([customUserId]),
      );
    });

    it('should create user with custom options', async () => {
      // Arrange
      const options = {
        email: 'custom@example.com',
        password: 'CustomPass123!',
        name: 'Custom User',
        roles: [UserRole.CUSTOMER, UserRole.ADMIN],
        isActive: false,
        emailVerified: false,
      };

      // Act
      await createTestUserInDb(dataSource, undefined, options);

      // Assert
      expect(dataSource.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO users'),
        expect.arrayContaining([
          expect.any(String), // userId
          'custom@example.com',
          'CustomPass123!',
          'Custom User',
          JSON.stringify([UserRole.CUSTOMER, UserRole.ADMIN]),
          false,
          false,
        ]),
      );
    });

    it('should create user with single role', async () => {
      // Arrange
      const options = {
        roles: [UserRole.CUSTOMER],
      };

      // Act
      await createTestUserInDb(dataSource, undefined, options);

      // Assert
      expect(dataSource.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO users'),
        expect.arrayContaining([
          expect.any(String),
          expect.any(String),
          expect.any(String),
          expect.any(String),
          JSON.stringify([UserRole.CUSTOMER]),
        ]),
      );
    });

    it('should handle database errors', async () => {
      // Arrange
      const dbError = new Error('Database connection failed');
      (dataSource.query as jest.Mock).mockRejectedValue(dbError);

      // Act & Assert
      await expect(createTestUserInDb(dataSource)).rejects.toThrow('Database connection failed');
    });
  });
});

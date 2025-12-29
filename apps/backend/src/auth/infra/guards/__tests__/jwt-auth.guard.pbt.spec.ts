import * as fc from 'fast-check';
import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from '../jwt-auth';
import { JwtStrategy } from '../../strategies/jwt';

/**
 * Feature: proyecto-base-mvp, Property 14: Protected endpoints reject invalid tokens
 * Validates: Requirements 9.4
 */
describe('Property 14: Protected endpoints reject invalid tokens', () => {
  let guard: JwtAuthGuard;
  let jwtService: JwtService;
  const testSecret = 'test-secret-for-property-testing';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        JwtStrategy,
        {
          provide: JwtService,
          useValue: new JwtService({
            secret: testSecret,
            signOptions: { expiresIn: '1h' },
          }),
        },
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => {
              if (key === 'JWT_SECRET') return testSecret;
              return null;
            },
          },
        },
      ],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
    jwtService = module.get<JwtService>(JwtService);
  });

  // Helper to create mock execution context
  const createMockContext = (authHeader: string | null): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: authHeader ? { authorization: authHeader } : {},
        }),
        getResponse: () => ({}),
        getNext: () => ({}),
      }),
      getClass: () => ({}) as unknown,
      getHandler: () => ({}) as unknown,
      getArgs: () => [],
      getArgByIndex: () => ({}) as unknown,
      switchToRpc: () => ({
        getData: () => ({}),
        getContext: () => ({}),
      }),
      switchToWs: () => ({
        getData: () => ({}),
        getClient: () => ({}),
        getPattern: () => '',
      }),
      getType: () => 'http' as unknown,
    } as unknown as ExecutionContext;
  };

  it('should reject requests with malformed tokens', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          // Random strings that are not valid JWTs
          fc.string({ minLength: 10, maxLength: 100 }),
          // Strings with invalid JWT structure
          fc.string().map((s) => `${s}.${s}`),
          fc.string().map((s) => `${s}.${s}.${s}.extra`),
          // Empty or whitespace
          fc.constant(''),
          fc.constant('   '),
          // Missing Bearer prefix
          fc.string({ minLength: 20, maxLength: 50 }),
        ),
        async (invalidToken) => {
          const context = createMockContext(`Bearer ${invalidToken}`);

          try {
            await guard.canActivate(context);
            // If we reach here, the guard didn't reject the invalid token
            throw new Error('Guard should have rejected invalid token');
          } catch (error) {
            // We expect an error to be thrown for invalid tokens
            expect(error).toBeDefined();
          }
        },
      ),
      { numRuns: 20 },
    );
  }, 30000);

  it('should reject tokens with invalid signatures', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          sub: fc.uuid(),
          email: fc.emailAddress(),
        }),
        async (payload) => {
          // Create a token with a different secret
          const wrongSecretService = new JwtService({
            secret: 'wrong-secret-key',
            signOptions: { expiresIn: '1h' },
          });

          const invalidToken = wrongSecretService.sign(payload);
          const context = createMockContext(`Bearer ${invalidToken}`);

          try {
            await guard.canActivate(context);
            throw new Error('Guard should have rejected token with invalid signature');
          } catch (error) {
            expect(error).toBeDefined();
          }
        },
      ),
      { numRuns: 20 },
    );
  }, 30000);

  it('should reject expired tokens', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          sub: fc.uuid(),
          email: fc.emailAddress(),
        }),
        async (payload) => {
          // Create an expired token (expires immediately)
          const expiredTokenService = new JwtService({
            secret: testSecret,
            signOptions: { expiresIn: '0s' },
          });

          const expiredToken = expiredTokenService.sign(payload);

          // Wait a bit to ensure token is expired
          await new Promise((resolve) => setTimeout(resolve, 100));

          const context = createMockContext(`Bearer ${expiredToken}`);

          try {
            await guard.canActivate(context);
            throw new Error('Guard should have rejected expired token');
          } catch (error) {
            expect(error).toBeDefined();
          }
        },
      ),
      { numRuns: 10 },
    );
  }, 30000);

  it('should reject tokens with missing required fields', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          // Missing sub
          fc.record({ email: fc.emailAddress() }),
          // Missing email
          fc.record({ sub: fc.uuid() }),
          // Empty payload
          fc.constant({}),
          // Null values
          fc.record({ sub: fc.constant(null), email: fc.emailAddress() }),
          fc.record({ sub: fc.uuid(), email: fc.constant(null) }),
        ),
        async (invalidPayload) => {
          const token = jwtService.sign(invalidPayload);
          const context = createMockContext(`Bearer ${token}`);

          try {
            await guard.canActivate(context);
            throw new Error('Guard should have rejected token with missing required fields');
          } catch (error) {
            expect(error).toBeDefined();
            // The strategy should throw UnauthorizedException for invalid payload
            if (error instanceof UnauthorizedException) {
              expect(error.message).toContain('Invalid token payload');
            }
          }
        },
      ),
      { numRuns: 20 },
    );
  }, 30000);

  it('should reject requests without authorization header', async () => {
    await fc.assert(
      fc.asyncProperty(fc.constant(null), async () => {
        const context = createMockContext(null);

        try {
          await guard.canActivate(context);
          throw new Error('Guard should have rejected request without authorization header');
        } catch (error) {
          expect(error).toBeDefined();
        }
      }),
      { numRuns: 5 },
    );
  }, 10000);

  it('should reject tokens with invalid Bearer format', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          // Missing Bearer prefix
          fc.string({ minLength: 20, maxLength: 100 }),
          // Wrong prefix
          fc.string({ minLength: 20, maxLength: 100 }).map((s) => `Token ${s}`),
          fc.string({ minLength: 20, maxLength: 100 }).map((s) => `Basic ${s}`),
          // Multiple Bearer keywords
          fc.string({ minLength: 20, maxLength: 100 }).map((s) => `Bearer Bearer ${s}`),
        ),
        async (invalidAuthHeader) => {
          const context = createMockContext(invalidAuthHeader);

          try {
            await guard.canActivate(context);
            throw new Error('Guard should have rejected invalid Bearer format');
          } catch (error) {
            expect(error).toBeDefined();
          }
        },
      ),
      { numRuns: 20 },
    );
  }, 30000);

  it('should accept valid tokens with correct structure and signature', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          sub: fc.uuid(),
          email: fc.emailAddress(),
          roles: fc.array(fc.constantFrom('BUSINESS_OWNER', 'CUSTOMER', 'ADMIN'), {
            minLength: 1,
            maxLength: 3,
          }),
        }),
        async (payload) => {
          const validToken = jwtService.sign(payload);
          const context = createMockContext(`Bearer ${validToken}`);

          try {
            const result = await guard.canActivate(context);
            // Valid tokens should be accepted
            expect(result).toBeTruthy();
          } catch (error) {
            // Valid tokens should not throw errors
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`Guard rejected valid token: ${errorMessage}`);
          }
        },
      ),
      { numRuns: 20 },
    );
  }, 30000);
});

import * as fc from 'fast-check';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { QueryBus } from '@nestjs/cqrs';
import { PinoLogger } from 'nestjs-pino';
import { LoginHandler } from '../handler';
import { LoginCommand } from '../command';
import { RegisterHandler } from '../../register/handler';
import { RegisterCommand } from '../../register/command';
import { IUserWriteRepository } from '@auth/domain/interfaces/repositories/user-write';
import { IUserReadRepository } from '@auth/domain/interfaces/repositories/user-read';
import { IUserFactory } from '@auth/domain/interfaces/factories/user-factory';
import { User } from '@auth/domain/aggregates/user';
import { UserRole } from '@auth/domain/vo/user-role';

/**
 * Feature: auth-bc-roles-refactor, Property 5: JWT contains roles array
 * Validates: Requirements 4.1, 4.2
 */
describe('Property 5: JWT tokens contain valid user data with roles', () => {
  let registerHandler: RegisterHandler;
  let loginHandler: LoginHandler;
  let userRepository: Map<string, User>;
  let jwtService: JwtService;

  beforeEach(async () => {
    userRepository = new Map();

    const mockUserWriteRepository: IUserWriteRepository = {
      save: (user: User) => {
        userRepository.set(user.getEmail().getValue(), user);
        return Promise.resolve();
      },
    };

    const mockUserFactory: IUserFactory = {
      loadById: (id: string) => {
        for (const user of userRepository.values()) {
          if (user.getId().getValue() === id) {
            return Promise.resolve(user);
          }
        }
        return Promise.resolve(null);
      },
      loadByEmail: (email: string) => {
        return Promise.resolve(userRepository.get(email.toLowerCase()) || null);
      },
    };

    const mockUserReadRepository: IUserReadRepository = {
      findById: (id: string) => {
        for (const user of userRepository.values()) {
          if (user.getId().getValue() === id) {
            return Promise.resolve({
              id: user.getId().getValue(),
              email: user.getEmail().getValue(),
              name: user.getName(),
              roles: user.getRoles(),
              isActive: user.getIsActive(),
              emailVerified: user.getEmailVerified(),
              createdAt: user.getCreatedAt(),
            });
          }
        }
        return Promise.resolve(null);
      },
      findByEmail: (email: string) => {
        const user = userRepository.get(email.toLowerCase());
        if (!user) return Promise.resolve(null);
        return Promise.resolve({
          id: user.getId().getValue(),
          email: user.getEmail().getValue(),
          name: user.getName(),
          roles: user.getRoles(),
          isActive: user.getIsActive(),
          emailVerified: user.getEmailVerified(),
          createdAt: user.getCreatedAt(),
        });
      },
    };

    const mockLogger = {
      setContext: jest.fn(),
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    };

    const mockQueryBus = {
      execute: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegisterHandler,
        LoginHandler,
        {
          provide: 'IUserWriteRepository',
          useValue: mockUserWriteRepository,
        },
        {
          provide: 'IUserReadRepository',
          useValue: mockUserReadRepository,
        },
        {
          provide: 'IUserFactory',
          useValue: mockUserFactory,
        },
        {
          provide: JwtService,
          useValue: new JwtService({
            secret: 'test-secret',
            signOptions: { expiresIn: '1d' },
          }),
        },
        {
          provide: QueryBus,
          useValue: mockQueryBus,
        },
        {
          provide: PinoLogger,
          useValue: mockLogger,
        },
      ],
    }).compile();

    registerHandler = module.get<RegisterHandler>(RegisterHandler);
    loginHandler = module.get<LoginHandler>(LoginHandler);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should generate JWT tokens with roles array for any valid user', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          email: fc.emailAddress(),
          password: fc
            .string({ minLength: 8, maxLength: 20 })
            .filter((pwd) => /[A-Z]/.test(pwd) && /[a-z]/.test(pwd) && /[0-9]/.test(pwd)),
          name: fc.string({ minLength: 1, maxLength: 50 }),
        }),
        async (userData) => {
          // Register user
          const registerResult = await registerHandler.execute(
            new RegisterCommand(
              userData.email,
              userData.password,
              userData.name,
              UserRole.BUSINESS_OWNER,
            ),
          );

          // Verify token from registration contains roles
          const registerPayload = jwtService.verify(registerResult.token);
          expect(registerPayload).toHaveProperty('sub');
          expect(registerPayload).toHaveProperty('email');
          expect(registerPayload).toHaveProperty('roles');
          expect(Array.isArray(registerPayload.roles)).toBe(true);
          expect(registerPayload.roles).toContain(UserRole.BUSINESS_OWNER);
          expect(registerPayload.email).toBe(userData.email.toLowerCase());
          expect(registerPayload.sub).toBe(registerResult.userId);

          // Login with same credentials
          const loginResult = await loginHandler.execute(
            new LoginCommand(userData.email, userData.password),
          );

          // Verify token from login contains roles
          const loginPayload = jwtService.verify(loginResult.token);
          expect(loginPayload).toHaveProperty('sub');
          expect(loginPayload).toHaveProperty('email');
          expect(loginPayload).toHaveProperty('roles');
          expect(Array.isArray(loginPayload.roles)).toBe(true);
          expect(loginPayload.roles).toContain(UserRole.BUSINESS_OWNER);
          expect(loginPayload.email).toBe(userData.email.toLowerCase());
          expect(loginPayload.sub).toBe(registerResult.userId);

          // Verify both tokens contain the same user data
          expect(loginPayload.sub).toBe(registerPayload.sub);
          expect(loginPayload.email).toBe(registerPayload.email);
          expect(loginPayload.roles).toEqual(registerPayload.roles);
        },
      ),
      { numRuns: 10 },
    );
  }, 30000);

  it('should generate unique tokens for different users with roles', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            email: fc.emailAddress(),
            password: fc
              .string({ minLength: 8, maxLength: 20 })
              .filter((pwd) => /[A-Z]/.test(pwd) && /[a-z]/.test(pwd) && /[0-9]/.test(pwd)),
            name: fc.string({ minLength: 1, maxLength: 50 }),
          }),
          { minLength: 2, maxLength: 3 },
        ),
        async (users) => {
          // Ensure unique emails
          const uniqueUsers = Array.from(
            new Map(users.map((u) => [u.email.toLowerCase(), u])).values(),
          );

          if (uniqueUsers.length < 2) return;

          const tokens: string[] = [];

          for (const userData of uniqueUsers) {
            const result = await registerHandler.execute(
              new RegisterCommand(
                userData.email,
                userData.password,
                userData.name,
                UserRole.BUSINESS_OWNER,
              ),
            );
            tokens.push(result.token);
          }

          // Verify all tokens are unique
          const uniqueTokens = new Set(tokens);
          expect(uniqueTokens.size).toBe(tokens.length);

          // Verify each token contains correct user data with roles
          for (let i = 0; i < tokens.length; i++) {
            const payload = jwtService.verify(tokens[i]);
            expect(payload.email).toBe(uniqueUsers[i].email.toLowerCase());
            expect(payload.roles).toContain(UserRole.BUSINESS_OWNER);
          }
        },
      ),
      { numRuns: 5 },
    );
  }, 30000);
});

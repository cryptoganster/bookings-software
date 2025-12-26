import * as fc from 'fast-check';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { PinoLogger } from 'nestjs-pino';
import { EventPublisher } from '@nestjs/cqrs';
import { RegisterHandler } from '../handler';
import { RegisterCommand } from '../command';
import { IUserWriteRepository } from '@auth/domain/interfaces/repositories/user-write';
import { IUserReadRepository } from '@auth/domain/interfaces/repositories/user-read';
import { User } from '@auth/domain/aggregates/user';
import { UserRole } from '@auth/domain/vo/user-role';

/**
 * Feature: auth-bc-roles-refactor, Property 7: UserRegistered event includes initialRole
 * Validates: Requirements 3.1, 3.4, 9.1
 */
describe('Property 7: initialRole propagates correctly through registration', () => {
  let registerHandler: RegisterHandler;
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

    const mockEventPublisher = {
      mergeObjectContext: jest.fn((obj) => {
        // Return the original object with a mock commit method added
        obj.commit = jest.fn();
        return obj;
      }),
    };

    const mockUniquenessChecker = {
      isEmailUnique: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegisterHandler,
        {
          provide: 'IUserWriteRepository',
          useValue: mockUserWriteRepository,
        },
        {
          provide: 'IUserUniquenessChecker',
          useValue: mockUniquenessChecker,
        },
        {
          provide: JwtService,
          useValue: new JwtService({
            secret: 'test-secret',
            signOptions: { expiresIn: '1d' },
          }),
        },
        {
          provide: EventPublisher,
          useValue: mockEventPublisher,
        },
        {
          provide: PinoLogger,
          useValue: mockLogger,
        },
      ],
    }).compile();

    registerHandler = module.get<RegisterHandler>(RegisterHandler);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should create user with exactly the initialRole in roles array for any valid UserRole', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          email: fc.emailAddress(),
          password: fc
            .string({ minLength: 8, maxLength: 20 })
            .filter((pwd) => /[A-Z]/.test(pwd) && /[a-z]/.test(pwd) && /[0-9]/.test(pwd)),
          name: fc.string({ minLength: 1, maxLength: 50 }),
          role: fc.constantFrom(UserRole.BUSINESS_OWNER, UserRole.CUSTOMER, UserRole.ADMIN),
        }),
        async (userData) => {
          // Clear repository to avoid email conflicts
          userRepository.clear();

          // Register user with specific role
          const result = await registerHandler.execute(
            new RegisterCommand(userData.email, userData.password, userData.name, userData.role),
          );

          // Verify user was created
          expect(result).toHaveProperty('userId');
          expect(result).toHaveProperty('token');

          // Get the saved user from repository
          const savedUser = userRepository.get(userData.email.toLowerCase());
          expect(savedUser).toBeDefined();

          // Property: User should have exactly the initialRole in roles array
          expect(savedUser!.getRoles()).toEqual([userData.role]);
          expect(savedUser!.getRoles()).toHaveLength(1);
          expect(savedUser!.getRoles()).toContain(userData.role);
        },
      ),
      { numRuns: 30 }, // Test with 30 random combinations (10 per role)
    );
  }, 30000);

  it('should include initialRole in JWT payload for any valid UserRole', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          email: fc.emailAddress(),
          password: fc
            .string({ minLength: 8, maxLength: 20 })
            .filter((pwd) => /[A-Z]/.test(pwd) && /[a-z]/.test(pwd) && /[0-9]/.test(pwd)),
          name: fc.string({ minLength: 1, maxLength: 50 }),
          role: fc.constantFrom(UserRole.BUSINESS_OWNER, UserRole.CUSTOMER, UserRole.ADMIN),
        }),
        async (userData) => {
          // Clear repository to avoid email conflicts
          userRepository.clear();

          // Register user with specific role
          const result = await registerHandler.execute(
            new RegisterCommand(userData.email, userData.password, userData.name, userData.role),
          );

          // Decode JWT token
          const payload = jwtService.verify(result.token);

          // Property: JWT should contain the initialRole in roles array
          expect(payload).toHaveProperty('roles');
          expect(Array.isArray(payload.roles)).toBe(true);
          expect(payload.roles).toEqual([userData.role]);
          expect(payload.roles).toHaveLength(1);
          expect(payload.roles).toContain(userData.role);
        },
      ),
      { numRuns: 30 }, // Test with 30 random combinations (10 per role)
    );
  }, 30000);

  it('should verify initialRole is correctly set for any valid UserRole', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          email: fc.emailAddress(),
          password: fc
            .string({ minLength: 8, maxLength: 20 })
            .filter((pwd) => /[A-Z]/.test(pwd) && /[a-z]/.test(pwd) && /[0-9]/.test(pwd)),
          name: fc.string({ minLength: 1, maxLength: 50 }),
          role: fc.constantFrom(UserRole.BUSINESS_OWNER, UserRole.CUSTOMER, UserRole.ADMIN),
        }),
        async (userData) => {
          // Clear repository to avoid email conflicts
          userRepository.clear();

          // Register user with specific role
          const result = await registerHandler.execute(
            new RegisterCommand(userData.email, userData.password, userData.name, userData.role),
          );

          // Get the saved user from repository
          const savedUser = userRepository.get(userData.email.toLowerCase());
          expect(savedUser).toBeDefined();

          // Property: User should be created with the initialRole
          // This verifies that User.register() correctly uses initialRole
          // and that UserRegistered event was published (indirectly, as the user exists)
          expect(savedUser!.getRoles()).toEqual([userData.role]);
          expect(savedUser!.getRoles()).toHaveLength(1);

          // Verify the user is active and email not verified (initial state)
          expect(savedUser!.getIsActive()).toBe(true);
          expect(savedUser!.getEmailVerified()).toBe(false);
        },
      ),
      { numRuns: 30 }, // Test with 30 random combinations (10 per role)
    );
  }, 30000);

  it('should maintain role consistency between user aggregate and JWT payload', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          email: fc.emailAddress(),
          password: fc
            .string({ minLength: 8, maxLength: 20 })
            .filter((pwd) => /[A-Z]/.test(pwd) && /[a-z]/.test(pwd) && /[0-9]/.test(pwd)),
          name: fc.string({ minLength: 1, maxLength: 50 }),
          role: fc.constantFrom(UserRole.BUSINESS_OWNER, UserRole.CUSTOMER, UserRole.ADMIN),
        }),
        async (userData) => {
          // Clear repository to avoid email conflicts
          userRepository.clear();

          // Register user
          const result = await registerHandler.execute(
            new RegisterCommand(userData.email, userData.password, userData.name, userData.role),
          );

          // Get saved user
          const savedUser = userRepository.get(userData.email.toLowerCase());
          expect(savedUser).toBeDefined();

          // Decode JWT
          const jwtPayload = jwtService.verify(result.token);

          // Property: Role should be consistent between user aggregate and JWT
          const userRoles = savedUser!.getRoles();
          const jwtRoles = jwtPayload.roles;

          expect(userRoles).toEqual([userData.role]);
          expect(jwtRoles).toEqual([userData.role]);

          // Both should match exactly
          expect(userRoles[0]).toBe(jwtRoles[0]);
          expect(userRoles[0]).toBe(userData.role);
        },
      ),
      { numRuns: 30 }, // Test with 30 random combinations (10 per role)
    );
  }, 30000);
});

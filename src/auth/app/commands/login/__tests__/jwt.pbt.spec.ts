import * as fc from 'fast-check';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { LoginHandler } from '../handler';
import { LoginCommand } from '../command';
import { RegisterHandler } from '../../register/handler';
import { RegisterCommand } from '../../register/command';
import { IUserWriteRepository } from '@auth/domain/interfaces/repositories/user-write';
import { IUserReadRepository } from '@auth/domain/interfaces/repositories/user-read';
import { User } from '@auth/domain/aggregates/user';
import { UUID } from '@shared/vo/uuid';

/**
 * Feature: proyecto-base-mvp, Property 13: JWT tokens contain valid user data
 * Validates: Requirements 9.3
 */
describe('Property 13: JWT tokens contain valid user data', () => {
  let registerHandler: RegisterHandler;
  let loginHandler: LoginHandler;
  let userRepository: Map<string, User>;
  let jwtService: JwtService;

  beforeEach(async () => {
    userRepository = new Map();

    const mockUserWriteRepository: IUserWriteRepository = {
      save: async (user: User) => {
        userRepository.set(user.getEmail().getValue(), user);
      },
      findById: async (id: UUID) => {
        for (const user of userRepository.values()) {
          if (user.getId().equals(id)) {
            return user;
          }
        }
        return null;
      },
      findByEmail: async (email: string) => {
        return userRepository.get(email.toLowerCase()) || null;
      },
    };

    const mockUserReadRepository: IUserReadRepository = {
      findById: async (id: string) => {
        for (const user of userRepository.values()) {
          if (user.getId().getValue() === id) {
            return {
              id: user.getId().getValue(),
              email: user.getEmail().getValue(),
              name: user.getName(),
              businessId: user.getBusinessId()?.getValue() || null,
              createdAt: user.getCreatedAt(),
            };
          }
        }
        return null;
      },
      findByEmail: async (email: string) => {
        const user = userRepository.get(email.toLowerCase());
        if (!user) return null;
        return {
          id: user.getId().getValue(),
          email: user.getEmail().getValue(),
          name: user.getName(),
          businessId: user.getBusinessId()?.getValue() || null,
          createdAt: user.getCreatedAt(),
        };
      },
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
          provide: JwtService,
          useValue: new JwtService({
            secret: 'test-secret',
            signOptions: { expiresIn: '1d' },
          }),
        },
      ],
    }).compile();

    registerHandler = module.get<RegisterHandler>(RegisterHandler);
    loginHandler = module.get<LoginHandler>(LoginHandler);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should generate JWT tokens with valid user data for any valid user', async () => {
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
            new RegisterCommand(userData.email, userData.password, userData.name),
          );

          // Verify token from registration
          const registerPayload = jwtService.verify(registerResult.accessToken);
          expect(registerPayload).toHaveProperty('sub');
          expect(registerPayload).toHaveProperty('email');
          expect(registerPayload.email).toBe(userData.email.toLowerCase());
          expect(registerPayload.sub).toBe(registerResult.userId);

          // Login with same credentials
          const loginResult = await loginHandler.execute(
            new LoginCommand(userData.email, userData.password),
          );

          // Verify token from login
          const loginPayload = jwtService.verify(loginResult.accessToken);
          expect(loginPayload).toHaveProperty('sub');
          expect(loginPayload).toHaveProperty('email');
          expect(loginPayload.email).toBe(userData.email.toLowerCase());
          expect(loginPayload.sub).toBe(registerResult.userId);

          // Verify both tokens contain the same user data
          expect(loginPayload.sub).toBe(registerPayload.sub);
          expect(loginPayload.email).toBe(registerPayload.email);
        },
      ),
      { numRuns: 10 },
    );
  }, 30000);

  it('should generate unique tokens for different users', async () => {
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
              new RegisterCommand(userData.email, userData.password, userData.name),
            );
            tokens.push(result.accessToken);
          }

          // Verify all tokens are unique
          const uniqueTokens = new Set(tokens);
          expect(uniqueTokens.size).toBe(tokens.length);

          // Verify each token contains correct user data
          for (let i = 0; i < tokens.length; i++) {
            const payload = jwtService.verify(tokens[i]);
            expect(payload.email).toBe(uniqueUsers[i].email.toLowerCase());
          }
        },
      ),
      { numRuns: 5 },
    );
  }, 30000);
});

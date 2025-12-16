import * as fc from 'fast-check';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { RegisterDto } from '../register';
import { LoginDto } from '../login';

/**
 * Feature: proyecto-base-mvp, Property 15: Validation errors return 400 with details
 * Validates: Requirements 10.4
 *
 * Property: For any invalid DTO, validation should return detailed error messages
 */
describe('Validation Property Tests', () => {
  describe('RegisterDto validation', () => {
    it('should reject invalid emails with detailed errors', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string().filter((s) => !s.includes('@') || s.length < 3),
          fc.string({ minLength: 8 }),
          fc.string({ minLength: 1 }),
          async (invalidEmail, password, name) => {
            const dto = plainToInstance(RegisterDto, {
              email: invalidEmail,
              password,
              name,
            });

            const errors = await validate(dto);

            // Should have validation errors
            expect(errors.length).toBeGreaterThan(0);

            // Should have email-related error
            const emailError = errors.find((e) => e.property === 'email');
            expect(emailError).toBeDefined();
            expect(emailError?.constraints).toBeDefined();
          },
        ),
        { numRuns: 100 },
      );
    });

    it('should reject short passwords with detailed errors', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          fc.string({ maxLength: 7 }),
          fc.string({ minLength: 1 }),
          async (email, shortPassword, name) => {
            const dto = plainToInstance(RegisterDto, {
              email,
              password: shortPassword,
              name,
            });

            const errors = await validate(dto);

            // Should have validation errors
            expect(errors.length).toBeGreaterThan(0);

            // Should have password-related error
            const passwordError = errors.find((e) => e.property === 'password');
            expect(passwordError).toBeDefined();
            expect(passwordError?.constraints).toBeDefined();
          },
        ),
        { numRuns: 100 },
      );
    });

    it('should reject empty required fields with detailed errors', async () => {
      await fc.assert(
        fc.asyncProperty(fc.constantFrom('email', 'password', 'name'), async (fieldToOmit) => {
          const validData = {
            email: 'test@example.com',
            password: 'password123',
            name: 'Test User',
          };

          // Omit one field
          const invalidData = { ...validData };
          delete invalidData[fieldToOmit as keyof typeof invalidData];

          const dto = plainToInstance(RegisterDto, invalidData);
          const errors = await validate(dto);

          // Should have validation errors
          expect(errors.length).toBeGreaterThan(0);

          // Should have error for the omitted field
          const fieldError = errors.find((e) => e.property === fieldToOmit);
          expect(fieldError).toBeDefined();
          expect(fieldError?.constraints).toBeDefined();
        }),
        { numRuns: 100 },
      );
    });

    it('should accept valid RegisterDto', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          fc.string({ minLength: 8 }),
          fc.string({ minLength: 1 }),
          async (email, password, name) => {
            const dto = plainToInstance(RegisterDto, {
              email,
              password,
              name,
            });

            const errors = await validate(dto);

            // Should have no validation errors
            expect(errors.length).toBe(0);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe('LoginDto validation', () => {
    it('should reject invalid emails with detailed errors', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string().filter((s) => !s.includes('@') || s.length < 3),
          fc.string({ minLength: 1 }),
          async (invalidEmail, password) => {
            const dto = plainToInstance(LoginDto, {
              email: invalidEmail,
              password,
            });

            const errors = await validate(dto);

            // Should have validation errors
            expect(errors.length).toBeGreaterThan(0);

            // Should have email-related error
            const emailError = errors.find((e) => e.property === 'email');
            expect(emailError).toBeDefined();
            expect(emailError?.constraints).toBeDefined();
          },
        ),
        { numRuns: 100 },
      );
    });

    it('should reject empty required fields with detailed errors', async () => {
      await fc.assert(
        fc.asyncProperty(fc.constantFrom('email', 'password'), async (fieldToOmit) => {
          const validData = {
            email: 'test@example.com',
            password: 'password123',
          };

          // Omit one field
          const invalidData = { ...validData };
          delete invalidData[fieldToOmit as keyof typeof invalidData];

          const dto = plainToInstance(LoginDto, invalidData);
          const errors = await validate(dto);

          // Should have validation errors
          expect(errors.length).toBeGreaterThan(0);

          // Should have error for the omitted field
          const fieldError = errors.find((e) => e.property === fieldToOmit);
          expect(fieldError).toBeDefined();
          expect(fieldError?.constraints).toBeDefined();
        }),
        { numRuns: 100 },
      );
    });

    it('should accept valid LoginDto', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          fc.string({ minLength: 1 }),
          async (email, password) => {
            const dto = plainToInstance(LoginDto, {
              email,
              password,
            });

            const errors = await validate(dto);

            // Should have no validation errors
            expect(errors.length).toBe(0);
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});

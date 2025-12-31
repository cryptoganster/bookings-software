/**
 * Property-Based Tests for Register Form Validation Schema
 *
 * Property 2: Form validation consistency
 * Validates: Requirements VR-1, VR-2, VR-3, VR-4
 *
 * These tests verify that the Zod schema validation produces consistent results
 * across multiple validations of the same input, and correctly identifies all
 * violations of the validation rules.
 */

import { describe, expect } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { registerSchema, type RegisterFormData } from "../model/schema";

describe("registerSchema - Property-Based Tests", () => {
  // Arbitraries for generating test data
  const validEmailArbitrary = fc
    .tuple(
      fc.stringMatching(/^[a-z0-9]{1,20}$/),
      fc.stringMatching(/^[a-z0-9]{1,10}$/),
      fc.constantFrom("com", "org", "net", "io", "co"),
    )
    .map(([local, domain, tld]) => `${local}@${domain}.${tld}`);

  const invalidEmailArbitrary = fc.oneof(
    fc.constant(""),
    fc.constant("invalid"),
    fc.constant("no-at-sign.com"),
    fc.constant("@no-local.com"),
    fc.constant("no-domain@"),
    fc.constant("spaces in@email.com"),
    fc.stringMatching(/^[^@]+$/), // No @ sign
  );

  // Valid password: 8+ chars, uppercase, lowercase, number, special char
  // Ensure minimum 8 characters by using fixed structure + padding
  const validPasswordArbitrary = fc
    .tuple(
      fc.stringMatching(/^[A-Z]{1,2}$/), // 1-2 Uppercase
      fc.stringMatching(/^[a-z]{1,2}$/), // 1-2 Lowercase
      fc.stringMatching(/^[0-9]{1,2}$/), // 1-2 Numbers
      fc.constantFrom("!", "@", "#", "$", "%", "^", "&", "*"), // 1 Special char
      fc.stringMatching(/^[a-zA-Z0-9]{3,10}$/), // 3-10 Padding to ensure >= 8 chars
    )
    .map(
      ([upper, lower, num, special, padding]) =>
        `${upper}${lower}${num}${special}${padding}`,
    )
    .filter((p) => p.length >= 8); // Extra safety filter

  const shortPasswordArbitrary = fc.stringMatching(/^.{1,7}$/);

  const passwordMissingUppercaseArbitrary = fc
    .stringMatching(/^[a-z0-9!@#$%^&*]{8,20}$/)
    .filter((p) => !/[A-Z]/.test(p));

  const passwordMissingLowercaseArbitrary = fc
    .stringMatching(/^[A-Z0-9!@#$%^&*]{8,20}$/)
    .filter((p) => !/[a-z]/.test(p));

  const passwordMissingNumberArbitrary = fc
    .stringMatching(/^[a-zA-Z!@#$%^&*]{8,20}$/)
    .filter((p) => !/[0-9]/.test(p));

  const passwordMissingSpecialArbitrary = fc
    .stringMatching(/^[a-zA-Z0-9]{8,20}$/)
    .filter((p) => !/[!@#$%^&*(),.?":{}|<>]/.test(p));

  const validNameArbitrary = fc.stringMatching(/^[a-zA-Z ]{2,100}$/);

  const shortNameArbitrary = fc.stringMatching(/^[a-zA-Z]$/);

  const longNameArbitrary = fc.stringMatching(/^[a-zA-Z]{101,150}$/);

  describe("Property 2.1: Validation Consistency - Same input produces same result", () => {
    test.prop([
      validEmailArbitrary,
      validPasswordArbitrary,
      validNameArbitrary,
    ])(
      "valid form data should consistently pass validation",
      (email, password, name) => {
        const formData: RegisterFormData = {
          email,
          password,
          confirmPassword: password,
          name,
          acceptTerms: true,
        };

        // Validate multiple times
        const result1 = registerSchema.safeParse(formData);
        const result2 = registerSchema.safeParse(formData);
        const result3 = registerSchema.safeParse(formData);

        // All results should be consistent
        expect(result1.success).toBe(result2.success);
        expect(result2.success).toBe(result3.success);
        expect(result1.success).toBe(true);
      },
    );

    test.prop([
      fc.string({ minLength: 1, maxLength: 50 }),
      fc.string({ minLength: 1, maxLength: 50 }),
      fc.string({ minLength: 1, maxLength: 50 }),
      fc.boolean(),
    ])(
      "any form data should produce consistent validation results across multiple calls",
      (email, password, name, acceptTerms) => {
        const formData = {
          email,
          password,
          confirmPassword: password,
          name,
          acceptTerms,
        };

        const result1 = registerSchema.safeParse(formData);
        const result2 = registerSchema.safeParse(formData);

        // Results should be identical
        expect(result1.success).toBe(result2.success);

        if (!result1.success && !result2.success) {
          // Error paths should be the same
          const paths1 = result1.error.issues
            .map((i) => i.path.join("."))
            .sort();
          const paths2 = result2.error.issues
            .map((i) => i.path.join("."))
            .sort();
          expect(paths1).toEqual(paths2);
        }
      },
    );
  });

  describe("Property 2.2: Email Validation (VR-1)", () => {
    test.prop([validEmailArbitrary])(
      "valid emails should pass email validation",
      (email) => {
        const formData = {
          email,
          password: "ValidPass1!",
          confirmPassword: "ValidPass1!",
          name: "Test User",
          acceptTerms: true,
        };

        const result = registerSchema.safeParse(formData);
        expect(result.success).toBe(true);
      },
    );

    test.prop([invalidEmailArbitrary])(
      "invalid emails should fail validation with email error",
      (email) => {
        const formData = {
          email,
          password: "ValidPass1!",
          confirmPassword: "ValidPass1!",
          name: "Test User",
          acceptTerms: true,
        };

        const result = registerSchema.safeParse(formData);
        expect(result.success).toBe(false);

        if (!result.success) {
          const emailErrors = result.error.issues.filter(
            (issue) => issue.path[0] === "email",
          );
          expect(emailErrors.length).toBeGreaterThan(0);
        }
      },
    );
  });

  describe("Property 2.3: Password Validation (VR-2)", () => {
    test.prop([validPasswordArbitrary])(
      "valid passwords should pass password validation",
      (password) => {
        const formData = {
          email: "test@example.com",
          password,
          confirmPassword: password,
          name: "Test User",
          acceptTerms: true,
        };

        const result = registerSchema.safeParse(formData);
        expect(result.success).toBe(true);
      },
    );

    test.prop([shortPasswordArbitrary])(
      "passwords shorter than 8 characters should fail validation",
      (password) => {
        const formData = {
          email: "test@example.com",
          password,
          confirmPassword: password,
          name: "Test User",
          acceptTerms: true,
        };

        const result = registerSchema.safeParse(formData);
        expect(result.success).toBe(false);

        if (!result.success) {
          const passwordErrors = result.error.issues.filter(
            (issue) => issue.path[0] === "password",
          );
          expect(passwordErrors.length).toBeGreaterThan(0);
        }
      },
    );

    test.prop([passwordMissingUppercaseArbitrary])(
      "passwords without uppercase should fail validation",
      (password) => {
        const formData = {
          email: "test@example.com",
          password,
          confirmPassword: password,
          name: "Test User",
          acceptTerms: true,
        };

        const result = registerSchema.safeParse(formData);
        expect(result.success).toBe(false);

        if (!result.success) {
          const passwordErrors = result.error.issues.filter(
            (issue) => issue.path[0] === "password",
          );
          expect(passwordErrors.length).toBeGreaterThan(0);
        }
      },
    );

    test.prop([passwordMissingLowercaseArbitrary])(
      "passwords without lowercase should fail validation",
      (password) => {
        const formData = {
          email: "test@example.com",
          password,
          confirmPassword: password,
          name: "Test User",
          acceptTerms: true,
        };

        const result = registerSchema.safeParse(formData);
        expect(result.success).toBe(false);

        if (!result.success) {
          const passwordErrors = result.error.issues.filter(
            (issue) => issue.path[0] === "password",
          );
          expect(passwordErrors.length).toBeGreaterThan(0);
        }
      },
    );

    test.prop([passwordMissingNumberArbitrary])(
      "passwords without numbers should fail validation",
      (password) => {
        const formData = {
          email: "test@example.com",
          password,
          confirmPassword: password,
          name: "Test User",
          acceptTerms: true,
        };

        const result = registerSchema.safeParse(formData);
        expect(result.success).toBe(false);

        if (!result.success) {
          const passwordErrors = result.error.issues.filter(
            (issue) => issue.path[0] === "password",
          );
          expect(passwordErrors.length).toBeGreaterThan(0);
        }
      },
    );

    test.prop([passwordMissingSpecialArbitrary])(
      "passwords without special characters should fail validation",
      (password) => {
        const formData = {
          email: "test@example.com",
          password,
          confirmPassword: password,
          name: "Test User",
          acceptTerms: true,
        };

        const result = registerSchema.safeParse(formData);
        expect(result.success).toBe(false);

        if (!result.success) {
          const passwordErrors = result.error.issues.filter(
            (issue) => issue.path[0] === "password",
          );
          expect(passwordErrors.length).toBeGreaterThan(0);
        }
      },
    );
  });

  describe("Property 2.4: Confirm Password Validation (VR-3)", () => {
    test.prop([
      validPasswordArbitrary,
      validPasswordArbitrary.filter((p) => p.length > 0),
    ])(
      "mismatched passwords should fail validation",
      (password, differentPassword) => {
        // Ensure passwords are actually different
        const confirmPassword =
          password === differentPassword
            ? differentPassword + "X"
            : differentPassword;

        const formData = {
          email: "test@example.com",
          password,
          confirmPassword,
          name: "Test User",
          acceptTerms: true,
        };

        const result = registerSchema.safeParse(formData);

        // If passwords don't match, validation should fail
        if (password !== confirmPassword) {
          expect(result.success).toBe(false);

          if (!result.success) {
            const confirmPasswordErrors = result.error.issues.filter(
              (issue) => issue.path[0] === "confirmPassword",
            );
            expect(confirmPasswordErrors.length).toBeGreaterThan(0);
          }
        }
      },
    );

    test.prop([validPasswordArbitrary])(
      "matching passwords should pass confirm password validation",
      (password) => {
        const formData = {
          email: "test@example.com",
          password,
          confirmPassword: password, // Same password
          name: "Test User",
          acceptTerms: true,
        };

        const result = registerSchema.safeParse(formData);
        expect(result.success).toBe(true);
      },
    );
  });

  describe("Property 2.5: Name Validation (VR-4)", () => {
    test.prop([validNameArbitrary])(
      "valid names (2-100 chars) should pass validation",
      (name) => {
        const formData = {
          email: "test@example.com",
          password: "ValidPass1!",
          confirmPassword: "ValidPass1!",
          name,
          acceptTerms: true,
        };

        const result = registerSchema.safeParse(formData);
        expect(result.success).toBe(true);
      },
    );

    test.prop([shortNameArbitrary])(
      "names shorter than 2 characters should fail validation",
      (name) => {
        const formData = {
          email: "test@example.com",
          password: "ValidPass1!",
          confirmPassword: "ValidPass1!",
          name,
          acceptTerms: true,
        };

        const result = registerSchema.safeParse(formData);
        expect(result.success).toBe(false);

        if (!result.success) {
          const nameErrors = result.error.issues.filter(
            (issue) => issue.path[0] === "name",
          );
          expect(nameErrors.length).toBeGreaterThan(0);
        }
      },
    );

    test.prop([longNameArbitrary])(
      "names longer than 100 characters should fail validation",
      (name) => {
        const formData = {
          email: "test@example.com",
          password: "ValidPass1!",
          confirmPassword: "ValidPass1!",
          name,
          acceptTerms: true,
        };

        const result = registerSchema.safeParse(formData);
        expect(result.success).toBe(false);

        if (!result.success) {
          const nameErrors = result.error.issues.filter(
            (issue) => issue.path[0] === "name",
          );
          expect(nameErrors.length).toBeGreaterThan(0);
        }
      },
    );
  });

  describe("Property 2.6: Terms Acceptance Validation (PCR-1.2)", () => {
    test.prop([
      validEmailArbitrary,
      validPasswordArbitrary,
      validNameArbitrary,
    ])(
      "acceptTerms=false should always fail validation",
      (email, password, name) => {
        const formData = {
          email,
          password,
          confirmPassword: password,
          name,
          acceptTerms: false, // Not accepted
        };

        const result = registerSchema.safeParse(formData);
        expect(result.success).toBe(false);

        if (!result.success) {
          const termsErrors = result.error.issues.filter(
            (issue) => issue.path[0] === "acceptTerms",
          );
          expect(termsErrors.length).toBeGreaterThan(0);
        }
      },
    );

    test.prop([
      validEmailArbitrary,
      validPasswordArbitrary,
      validNameArbitrary,
    ])(
      "acceptTerms=true should pass terms validation",
      (email, password, name) => {
        const formData = {
          email,
          password,
          confirmPassword: password,
          name,
          acceptTerms: true, // Accepted
        };

        const result = registerSchema.safeParse(formData);
        expect(result.success).toBe(true);
      },
    );
  });

  describe("Property 2.7: Error Message Consistency", () => {
    test.prop([
      fc.string({ minLength: 0, maxLength: 50 }),
      fc.string({ minLength: 0, maxLength: 50 }),
      fc.string({ minLength: 0, maxLength: 50 }),
      fc.boolean(),
    ])(
      "validation errors should have consistent Spanish messages",
      (email, password, name, acceptTerms) => {
        const formData = {
          email,
          password,
          confirmPassword: password,
          name,
          acceptTerms,
        };

        const result = registerSchema.safeParse(formData);

        if (!result.success) {
          // All error messages should be in Spanish
          for (const issue of result.error.issues) {
            // Check that messages are not default Zod English messages
            expect(issue.message).not.toMatch(/^Required$/);
            expect(issue.message).not.toMatch(/^Invalid email$/);
            expect(issue.message).not.toMatch(/^String must contain/);

            // Messages should be in Spanish (contain Spanish characters or words)
            const spanishPatterns = [
              /requerido/i,
              /debe/i,
              /válido/i,
              /contraseña/i,
              /nombre/i,
              /email/i,
              /términos/i,
              /caracteres/i,
              /mayúscula/i,
              /minúscula/i,
              /número/i,
              /especial/i,
              /coinciden/i,
              /aceptar/i,
            ];

            const hasSpanishMessage = spanishPatterns.some((pattern) =>
              pattern.test(issue.message),
            );
            expect(hasSpanishMessage).toBe(true);
          }
        }
      },
    );
  });
});

/**
 * Property-Based Tests for Password Strength Calculator
 *
 * Property 1: Password strength calculation determinism
 * Validates: Requirements FR-1.3, VR-2
 *
 * These tests verify that the password strength calculation is deterministic
 * and produces consistent results for the same input.
 */

import { describe, expect } from "vitest";
import { fc, test } from "@fast-check/vitest";
import {
  calculatePasswordStrength,
  getStrengthColor,
  getStrengthPercentage,
  type StrengthLevel,
} from "../model/passwordStrength";

describe("passwordStrength - Property-Based Tests", () => {
  // Arbitraries for generating test data
  const anyPasswordArbitrary = fc.string({ minLength: 0, maxLength: 100 });

  // Password with all criteria met
  const strongPasswordArbitrary = fc
    .tuple(
      fc.stringMatching(/^[A-Z]{1,2}$/),
      fc.stringMatching(/^[a-z]{1,2}$/),
      fc.stringMatching(/^[0-9]{1,2}$/),
      fc.constantFrom("!", "@", "#", "$", "%", "^", "&", "*"),
      fc.stringMatching(/^[a-zA-Z0-9]{3,10}$/),
    )
    .map(
      ([upper, lower, num, special, padding]) =>
        `${upper}${lower}${num}${special}${padding}`,
    )
    .filter((p) => p.length >= 8);

  // Password with only lowercase
  const onlyLowercaseArbitrary = fc.stringMatching(/^[a-z]{8,20}$/);

  // Password with only uppercase
  const onlyUppercaseArbitrary = fc.stringMatching(/^[A-Z]{8,20}$/);

  // Password with only numbers
  const onlyNumbersArbitrary = fc.stringMatching(/^[0-9]{8,20}$/);

  // Short password (< 8 chars)
  const shortPasswordArbitrary = fc.stringMatching(/^.{0,7}$/);

  describe("Property 1.1: Determinism - Same input produces same result", () => {
    test.prop([anyPasswordArbitrary])(
      "calculatePasswordStrength should return identical results for same password",
      (password) => {
        const result1 = calculatePasswordStrength(password);
        const result2 = calculatePasswordStrength(password);
        const result3 = calculatePasswordStrength(password);

        // All results should be identical
        expect(result1.score).toBe(result2.score);
        expect(result2.score).toBe(result3.score);
        expect(result1.level).toBe(result2.level);
        expect(result2.level).toBe(result3.level);

        // All checks should be identical
        expect(result1.checks).toEqual(result2.checks);
        expect(result2.checks).toEqual(result3.checks);
      },
    );
  });

  describe("Property 1.2: Score Range", () => {
    test.prop([anyPasswordArbitrary])(
      "score should always be between 0 and 5",
      (password) => {
        const result = calculatePasswordStrength(password);

        expect(result.score).toBeGreaterThanOrEqual(0);
        expect(result.score).toBeLessThanOrEqual(5);
      },
    );

    test.prop([anyPasswordArbitrary])(
      "score should equal the number of checks passed",
      (password) => {
        const result = calculatePasswordStrength(password);

        const checksPassedCount = Object.values(result.checks).filter(
          Boolean,
        ).length;

        expect(result.score).toBe(checksPassedCount);
      },
    );
  });

  describe("Property 1.3: Level Mapping Consistency", () => {
    test.prop([anyPasswordArbitrary])(
      "level should be consistent with score",
      (password) => {
        const result = calculatePasswordStrength(password);

        if (result.score <= 1) {
          expect(result.level).toBe("weak");
        } else if (result.score === 2) {
          expect(result.level).toBe("fair");
        } else if (result.score <= 4) {
          expect(result.level).toBe("good");
        } else {
          expect(result.level).toBe("strong");
        }
      },
    );

    test.prop([anyPasswordArbitrary])(
      "level should be one of the valid StrengthLevel values",
      (password) => {
        const result = calculatePasswordStrength(password);
        const validLevels: StrengthLevel[] = ["weak", "fair", "good", "strong"];

        expect(validLevels).toContain(result.level);
      },
    );
  });

  describe("Property 1.4: Check Correctness", () => {
    test.prop([anyPasswordArbitrary])(
      "minLength check should be true iff password.length >= 8",
      (password) => {
        const result = calculatePasswordStrength(password);

        expect(result.checks.minLength).toBe(password.length >= 8);
      },
    );

    test.prop([anyPasswordArbitrary])(
      "hasUppercase check should be true iff password contains [A-Z]",
      (password) => {
        const result = calculatePasswordStrength(password);

        expect(result.checks.hasUppercase).toBe(/[A-Z]/.test(password));
      },
    );

    test.prop([anyPasswordArbitrary])(
      "hasLowercase check should be true iff password contains [a-z]",
      (password) => {
        const result = calculatePasswordStrength(password);

        expect(result.checks.hasLowercase).toBe(/[a-z]/.test(password));
      },
    );

    test.prop([anyPasswordArbitrary])(
      "hasNumber check should be true iff password contains [0-9]",
      (password) => {
        const result = calculatePasswordStrength(password);

        expect(result.checks.hasNumber).toBe(/[0-9]/.test(password));
      },
    );

    test.prop([anyPasswordArbitrary])(
      "hasSpecial check should be true iff password contains special chars",
      (password) => {
        const result = calculatePasswordStrength(password);
        const specialPattern = /[!@#$%^&*(),.?":{}|<>]/;

        expect(result.checks.hasSpecial).toBe(specialPattern.test(password));
      },
    );
  });

  describe("Property 1.5: Strong Password Guarantees", () => {
    test.prop([strongPasswordArbitrary])(
      "passwords meeting all criteria should have score 5 and level strong",
      (password) => {
        const result = calculatePasswordStrength(password);

        expect(result.score).toBe(5);
        expect(result.level).toBe("strong");
        expect(result.checks.minLength).toBe(true);
        expect(result.checks.hasUppercase).toBe(true);
        expect(result.checks.hasLowercase).toBe(true);
        expect(result.checks.hasNumber).toBe(true);
        expect(result.checks.hasSpecial).toBe(true);
      },
    );
  });

  describe("Property 1.6: Weak Password Guarantees", () => {
    test.prop([shortPasswordArbitrary])(
      "short passwords should have minLength check false",
      (password) => {
        const result = calculatePasswordStrength(password);

        expect(result.checks.minLength).toBe(false);
      },
    );

    test.prop([onlyLowercaseArbitrary])(
      "lowercase-only passwords should have hasUppercase, hasNumber, hasSpecial false",
      (password) => {
        const result = calculatePasswordStrength(password);

        expect(result.checks.hasLowercase).toBe(true);
        expect(result.checks.hasUppercase).toBe(false);
        expect(result.checks.hasNumber).toBe(false);
        expect(result.checks.hasSpecial).toBe(false);
      },
    );

    test.prop([onlyUppercaseArbitrary])(
      "uppercase-only passwords should have hasLowercase, hasNumber, hasSpecial false",
      (password) => {
        const result = calculatePasswordStrength(password);

        expect(result.checks.hasUppercase).toBe(true);
        expect(result.checks.hasLowercase).toBe(false);
        expect(result.checks.hasNumber).toBe(false);
        expect(result.checks.hasSpecial).toBe(false);
      },
    );

    test.prop([onlyNumbersArbitrary])(
      "number-only passwords should have hasUppercase, hasLowercase, hasSpecial false",
      (password) => {
        const result = calculatePasswordStrength(password);

        expect(result.checks.hasNumber).toBe(true);
        expect(result.checks.hasUppercase).toBe(false);
        expect(result.checks.hasLowercase).toBe(false);
        expect(result.checks.hasSpecial).toBe(false);
      },
    );
  });

  describe("Property 1.7: Helper Functions", () => {
    test.prop([anyPasswordArbitrary])(
      "getStrengthColor should return valid Mantine color for any password",
      (password) => {
        const result = calculatePasswordStrength(password);
        const color = getStrengthColor(result.level);

        const validColors = ["red", "orange", "yellow", "green"];
        expect(validColors).toContain(color);
      },
    );

    test.prop([anyPasswordArbitrary])(
      "getStrengthPercentage should return value between 0 and 100",
      (password) => {
        const result = calculatePasswordStrength(password);
        const percentage = getStrengthPercentage(result.score);

        expect(percentage).toBeGreaterThanOrEqual(0);
        expect(percentage).toBeLessThanOrEqual(100);
      },
    );

    test.prop([anyPasswordArbitrary])(
      "getStrengthPercentage should be (score / 5) * 100",
      (password) => {
        const result = calculatePasswordStrength(password);
        const percentage = getStrengthPercentage(result.score);

        expect(percentage).toBe((result.score / 5) * 100);
      },
    );
  });

  describe("Property 1.8: Color Mapping Consistency", () => {
    test.prop([anyPasswordArbitrary])(
      "color should be consistent with level",
      (password) => {
        const result = calculatePasswordStrength(password);
        const color = getStrengthColor(result.level);

        switch (result.level) {
          case "weak":
            expect(color).toBe("red");
            break;
          case "fair":
            expect(color).toBe("orange");
            break;
          case "good":
            expect(color).toBe("yellow");
            break;
          case "strong":
            expect(color).toBe("green");
            break;
        }
      },
    );
  });

  describe("Property 1.9: Empty Password", () => {
    test.prop([fc.constant("")])(
      "empty password should have score 0 and level weak",
      (password) => {
        const result = calculatePasswordStrength(password);

        expect(result.score).toBe(0);
        expect(result.level).toBe("weak");
        expect(result.checks.minLength).toBe(false);
        expect(result.checks.hasUppercase).toBe(false);
        expect(result.checks.hasLowercase).toBe(false);
        expect(result.checks.hasNumber).toBe(false);
        expect(result.checks.hasSpecial).toBe(false);
      },
    );
  });
});

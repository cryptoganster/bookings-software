/**
 * Password Strength Calculator
 *
 * Utility for calculating password strength based on criteria:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 *
 * Score: 0-5 based on criteria met
 * Level: weak (0-1), fair (2), good (3-4), strong (5)
 *
 * Requirements: FR-1.3
 */

/**
 * Strength level classification
 */
export type StrengthLevel = "weak" | "fair" | "good" | "strong";

/**
 * Password strength check results
 */
export interface PasswordChecks {
  /** Password has at least 8 characters */
  minLength: boolean;
  /** Password contains at least one uppercase letter [A-Z] */
  hasUppercase: boolean;
  /** Password contains at least one lowercase letter [a-z] */
  hasLowercase: boolean;
  /** Password contains at least one number [0-9] */
  hasNumber: boolean;
  /** Password contains at least one special character */
  hasSpecial: boolean;
}

/**
 * Complete password strength result
 */
export interface StrengthResult {
  /** Strength level classification */
  level: StrengthLevel;
  /** Numeric score (0-5) based on criteria met */
  score: number;
  /** Individual check results */
  checks: PasswordChecks;
}

/**
 * Special characters pattern for password validation
 * Matches: ! @ # $ % ^ & * ( ) , . ? " : { } | < >
 */
const SPECIAL_CHARS_PATTERN = /[!@#$%^&*(),.?":{}|<>]/;

/**
 * Calculates password strength based on security criteria
 *
 * @param password - The password to evaluate
 * @returns StrengthResult with level, score, and individual checks
 *
 * @example
 * ```ts
 * const result = calculatePasswordStrength("MyPass123!");
 * // result.level === "strong"
 * // result.score === 5
 * // result.checks.minLength === true
 * ```
 */
export const calculatePasswordStrength = (password: string): StrengthResult => {
  // Perform individual checks
  const checks: PasswordChecks = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: SPECIAL_CHARS_PATTERN.test(password),
  };

  // Calculate score (0-5) based on checks passed
  const score = Object.values(checks).filter(Boolean).length;

  // Determine strength level based on score
  const level = getStrengthLevel(score);

  return {
    level,
    score,
    checks,
  };
};

/**
 * Maps numeric score to strength level
 *
 * @param score - Numeric score (0-5)
 * @returns StrengthLevel classification
 */
const getStrengthLevel = (score: number): StrengthLevel => {
  if (score <= 1) {
    return "weak";
  }
  if (score === 2) {
    return "fair";
  }
  if (score <= 4) {
    return "good";
  }
  return "strong";
};

/**
 * Returns the color associated with a strength level
 * For use with Mantine Progress component
 *
 * @param level - Strength level
 * @returns Mantine color string
 */
export const getStrengthColor = (level: StrengthLevel): string => {
  switch (level) {
    case "weak":
      return "red";
    case "fair":
      return "orange";
    case "good":
      return "yellow";
    case "strong":
      return "green";
  }
};

/**
 * Returns the percentage for the progress bar based on score
 *
 * @param score - Numeric score (0-5)
 * @returns Percentage (0-100)
 */
export const getStrengthPercentage = (score: number): number => {
  return (score / 5) * 100;
};

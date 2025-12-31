/**
 * Property-Based Tests for useLogin Hook
 *
 * Tests Property 3: Role-based redirection correctness
 * Validates: Requirements FR-2.1
 *
 * For any authenticated user with a valid role array, after successful login
 * the system SHALL redirect to:
 * - `/` (dashboard) if roles include `BUSINESS_OWNER`
 * - `/my-appointments` if roles include only `CUSTOMER`
 * - `/admin` if roles include only `ADMIN`
 */

import { describe, it, expect } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { getRedirectPathForRoles } from "../model/useLogin";
import type { UserRole } from "@packages/shared-types";

// Valid user roles
const validRoles: UserRole[] = ["BUSINESS_OWNER", "CUSTOMER", "ADMIN"];

// Arbitrary for generating valid role arrays (non-empty)
const roleArrayArbitrary = fc
  .subarray(validRoles, { minLength: 1 })
  .map((roles) => roles as UserRole[]);

// Arbitrary for generating single role arrays
const singleRoleArbitrary = fc
  .constantFrom(...validRoles)
  .map((role) => [role] as UserRole[]);

describe("getRedirectPathForRoles - Property-Based Tests", () => {
  describe("Property 3: Role-based redirection correctness", () => {
    test.prop([roleArrayArbitrary], { numRuns: 100 })(
      "should always return a valid path string",
      (roles) => {
        const path = getRedirectPathForRoles(roles);

        // Path should be a non-empty string starting with /
        expect(typeof path).toBe("string");
        expect(path.length).toBeGreaterThan(0);
        expect(path.startsWith("/")).toBe(true);
      },
    );

    test.prop([roleArrayArbitrary], { numRuns: 100 })(
      "should be deterministic - same roles always produce same path",
      (roles) => {
        const path1 = getRedirectPathForRoles(roles);
        const path2 = getRedirectPathForRoles(roles);
        const path3 = getRedirectPathForRoles([...roles]); // Copy of array

        expect(path1).toBe(path2);
        expect(path1).toBe(path3);
      },
    );

    test.prop([roleArrayArbitrary], { numRuns: 100 })(
      "BUSINESS_OWNER role should always redirect to / regardless of other roles",
      (roles) => {
        // Add BUSINESS_OWNER to the roles
        const rolesWithBusinessOwner: UserRole[] = [
          ...new Set([...roles, "BUSINESS_OWNER" as UserRole]),
        ];
        const path = getRedirectPathForRoles(rolesWithBusinessOwner);

        expect(path).toBe("/");
      },
    );

    it("should redirect CUSTOMER-only to /my-appointments", () => {
      const path = getRedirectPathForRoles(["CUSTOMER"]);
      expect(path).toBe("/my-appointments");
    });

    it("should redirect ADMIN-only to /admin", () => {
      const path = getRedirectPathForRoles(["ADMIN"]);
      expect(path).toBe("/admin");
    });

    it("should redirect BUSINESS_OWNER to / (highest priority)", () => {
      const path = getRedirectPathForRoles(["BUSINESS_OWNER"]);
      expect(path).toBe("/");
    });

    it("should prioritize BUSINESS_OWNER over CUSTOMER", () => {
      const path = getRedirectPathForRoles(["CUSTOMER", "BUSINESS_OWNER"]);
      expect(path).toBe("/");
    });

    it("should prioritize BUSINESS_OWNER over ADMIN", () => {
      const path = getRedirectPathForRoles(["ADMIN", "BUSINESS_OWNER"]);
      expect(path).toBe("/");
    });

    it("should prioritize ADMIN over CUSTOMER", () => {
      const path = getRedirectPathForRoles(["CUSTOMER", "ADMIN"]);
      expect(path).toBe("/admin");
    });

    it("should handle all three roles with BUSINESS_OWNER priority", () => {
      const path = getRedirectPathForRoles([
        "CUSTOMER",
        "ADMIN",
        "BUSINESS_OWNER",
      ]);
      expect(path).toBe("/");
    });

    test.prop([singleRoleArbitrary], { numRuns: 100 })(
      "single role should map to expected path",
      (roles) => {
        const path = getRedirectPathForRoles(roles);
        const role = roles[0];

        if (role === "BUSINESS_OWNER") {
          expect(path).toBe("/");
        } else if (role === "ADMIN") {
          expect(path).toBe("/admin");
        } else if (role === "CUSTOMER") {
          expect(path).toBe("/my-appointments");
        }
      },
    );

    it("should return / for empty roles array (fallback)", () => {
      const path = getRedirectPathForRoles([]);
      expect(path).toBe("/");
    });

    test.prop([roleArrayArbitrary], { numRuns: 100 })(
      "order of roles in array should not affect result",
      (roles) => {
        // Shuffle the roles
        const shuffled = [...roles].sort(() => Math.random() - 0.5);

        const path1 = getRedirectPathForRoles(roles);
        const path2 = getRedirectPathForRoles(shuffled);

        expect(path1).toBe(path2);
      },
    );
  });
});

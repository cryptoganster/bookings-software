/**
 * Property-Based Tests for API Client
 *
 * Tests Property 6: Token expiration handling
 * Validates: Requirements SR-3.5
 *
 * For any API request that returns HTTP 401 (Unauthorized), the system SHALL:
 * 1. Clear the auth store state (user, token, businessId, isAuthenticated)
 * 2. Remove auth data from localStorage
 * 3. Redirect to /login
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { handleUnauthorized } from "../client";
import { useAuthStore } from "@app/store/auth.store";
import type { UserDto } from "@packages/shared-types";

// Mock window.location
const mockLocation = {
  href: "",
  pathname: "/dashboard",
};

Object.defineProperty(window, "location", {
  value: mockLocation,
  writable: true,
});

describe("API Client - Token Expiration Handling", () => {
  beforeEach(() => {
    // Reset location
    mockLocation.href = "";
    mockLocation.pathname = "/dashboard";

    // Clear localStorage
    localStorage.clear();

    // Reset auth store to initial state
    useAuthStore.setState({
      user: null,
      token: null,
      businessId: null,
      isAuthenticated: false,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Property 6: Token expiration handling", () => {
    it("should clear auth store state on 401", () => {
      // Setup: Simulate authenticated state
      const mockUser: UserDto = {
        id: "user-123",
        email: "test@example.com",
        name: "Test User",
        roles: ["BUSINESS_OWNER"],
        isActive: true,
        emailVerified: true,
        createdAt: new Date().toISOString(),
      };

      useAuthStore.getState().login(mockUser, "test-token", "business-123");

      // Verify authenticated state
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(useAuthStore.getState().token).toBe("test-token");
      expect(useAuthStore.getState().user).toEqual(mockUser);
      expect(useAuthStore.getState().businessId).toBe("business-123");

      // Act: Handle unauthorized
      handleUnauthorized();

      // Assert: Auth store should be cleared
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(useAuthStore.getState().token).toBeNull();
      expect(useAuthStore.getState().user).toBeNull();
      expect(useAuthStore.getState().businessId).toBeNull();
    });

    it("should redirect to /login on 401", () => {
      // Setup: Simulate authenticated state
      useAuthStore.getState().login(
        {
          id: "user-123",
          email: "test@example.com",
          name: "Test User",
          roles: ["BUSINESS_OWNER"],
          isActive: true,
          emailVerified: true,
          createdAt: new Date().toISOString(),
        },
        "test-token",
        "business-123",
      );

      // Act: Handle unauthorized
      handleUnauthorized();

      // Assert: Should redirect to login
      expect(mockLocation.href).toBe("/login");
    });

    it("should clear localStorage on 401", () => {
      // Setup: Simulate authenticated state with localStorage
      const mockUser: UserDto = {
        id: "user-123",
        email: "test@example.com",
        name: "Test User",
        roles: ["BUSINESS_OWNER"],
        isActive: true,
        emailVerified: true,
        createdAt: new Date().toISOString(),
      };

      useAuthStore.getState().login(mockUser, "test-token", "business-123");

      // Verify localStorage has auth data (Zustand persist middleware)
      const storedBefore = localStorage.getItem("auth-storage");
      expect(storedBefore).not.toBeNull();
      if (storedBefore) {
        const parsed = JSON.parse(storedBefore);
        expect(parsed.state.token).toBe("test-token");
      }

      // Act: Handle unauthorized
      handleUnauthorized();

      // Assert: localStorage should be cleared (via Zustand persist)
      const storedAfter = localStorage.getItem("auth-storage");
      if (storedAfter) {
        const parsed = JSON.parse(storedAfter);
        expect(parsed.state.token).toBeNull();
        expect(parsed.state.user).toBeNull();
        expect(parsed.state.businessId).toBeNull();
      }
    });

    it("should handle already logged out state gracefully", () => {
      // Setup: Already logged out
      expect(useAuthStore.getState().isAuthenticated).toBe(false);

      // Act: Handle unauthorized (should not throw)
      expect(() => handleUnauthorized()).not.toThrow();

      // Assert: Should still redirect
      expect(mockLocation.href).toBe("/login");
    });

    it("should clear all auth-related data atomically", () => {
      // Setup: Simulate authenticated state
      const mockUser: UserDto = {
        id: "user-123",
        email: "test@example.com",
        name: "Test User",
        roles: ["BUSINESS_OWNER", "CUSTOMER"],
        isActive: true,
        emailVerified: true,
        createdAt: new Date().toISOString(),
      };

      useAuthStore.getState().login(mockUser, "test-token", "business-123");

      // Act: Handle unauthorized
      handleUnauthorized();

      // Assert: All fields should be cleared together
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.businessId).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });
});

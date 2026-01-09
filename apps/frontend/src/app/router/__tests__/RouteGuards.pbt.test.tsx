/**
 * Property-Based Tests for Route Guards
 *
 * Tests Property 4: Protected route guard
 * Tests Property 5: Auth page guard for authenticated users
 *
 * Validates: Requirements FR-4.1, FR-4.2
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "../ProtectedRoute";
import { AuthPageGuard } from "../AuthPageGuard";
import { useAuthStore } from "@app/store/auth.store";
import type { UserDto, UserRole } from "@packages/shared-types";

// Mock the auth store
vi.mock("@app/store/auth.store", () => ({
  useAuthStore: vi.fn(),
}));

// Valid user roles
const validRoles: UserRole[] = ["BUSINESS_OWNER", "CUSTOMER", "ADMIN"];

// Arbitrary for generating valid role arrays (non-empty)
const roleArrayArbitrary = fc
  .subarray(validRoles, { minLength: 1 })
  .map((roles) => roles as UserRole[]);

// Helper to create mock user
function createMockUser(roles: UserRole[]): UserDto {
  return {
    id: "test-user-id",
    email: "test@example.com",
    name: "Test User",
    roles,
    isActive: true,
    emailVerified: true,
    createdAt: new Date().toISOString(),
  };
}

// Test components
function ProtectedContent() {
  return <div data-testid="protected-content">Protected Content</div>;
}

function LoginPageContent() {
  return <div data-testid="login-page">Login Page</div>;
}

function RegisterPageContent() {
  return <div data-testid="register-page">Register Page</div>;
}

function DashboardContent() {
  return <div data-testid="dashboard">Dashboard</div>;
}

function AdminContent() {
  return <div data-testid="admin">Admin</div>;
}

function MyAppointmentsContent() {
  return <div data-testid="my-appointments">My Appointments</div>;
}

describe("Route Guards - Property-Based Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cleanup(); // Clean up DOM before each test
  });

  afterEach(() => {
    cleanup(); // Clean up DOM after each test
  });

  describe("Property 4: Protected route guard", () => {
    test.prop([roleArrayArbitrary], { numRuns: 100 })(
      "unauthenticated users should be redirected to /login for any protected route",
      () => {
        cleanup(); // Ensure clean DOM for each property test iteration

        // Mock unauthenticated state
        vi.mocked(useAuthStore).mockImplementation((selector) => {
          const state = {
            isAuthenticated: false,
            user: null,
            token: null,
            businessId: null,
            businessTimezone: null,
            login: vi.fn(),
            updateBusinessId: vi.fn(),
            updateBusinessTimezone: vi.fn(),
            logout: vi.fn(),
          };
          return selector(state);
        });

        const { unmount } = render(
          <MemoryRouter initialEntries={["/protected"]}>
            <Routes>
              <Route path="/login" element={<LoginPageContent />} />
              <Route element={<ProtectedRoute />}>
                <Route path="/protected" element={<ProtectedContent />} />
              </Route>
            </Routes>
          </MemoryRouter>,
        );

        // Should redirect to login
        expect(screen.getByTestId("login-page")).toBeInTheDocument();
        expect(
          screen.queryByTestId("protected-content"),
        ).not.toBeInTheDocument();

        unmount(); // Clean up after assertion
      },
    );

    test.prop([roleArrayArbitrary], { numRuns: 100 })(
      "authenticated users with any valid role should access protected routes",
      (roles) => {
        cleanup(); // Ensure clean DOM for each property test iteration

        const mockUser = createMockUser(roles);

        // Mock authenticated state
        vi.mocked(useAuthStore).mockImplementation((selector) => {
          const state = {
            isAuthenticated: true,
            user: mockUser,
            token: "test-token",
            businessId: "test-business-id",
            businessTimezone: null,
            login: vi.fn(),
            updateBusinessTimezone: vi.fn(),
            updateBusinessId: vi.fn(),
            logout: vi.fn(),
          };
          return selector(state);
        });

        const { unmount } = render(
          <MemoryRouter initialEntries={["/protected"]}>
            <Routes>
              <Route path="/login" element={<LoginPageContent />} />
              <Route element={<ProtectedRoute />}>
                <Route path="/protected" element={<ProtectedContent />} />
              </Route>
            </Routes>
          </MemoryRouter>,
        );

        // Should show protected content
        expect(screen.getByTestId("protected-content")).toBeInTheDocument();
        expect(screen.queryByTestId("login-page")).not.toBeInTheDocument();

        unmount(); // Clean up after assertion
      },
    );

    it("should redirect unauthenticated user from / to /login", () => {
      vi.mocked(useAuthStore).mockImplementation((selector) => {
        const state = {
          isAuthenticated: false,
          user: null,
          token: null,
          businessId: null,
          businessTimezone: null,
          login: vi.fn(),
          updateBusinessTimezone: vi.fn(),
          updateBusinessId: vi.fn(),
          logout: vi.fn(),
        };
        return selector(state);
      });

      render(
        <MemoryRouter initialEntries={["/"]}>
          <Routes>
            <Route path="/login" element={<LoginPageContent />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<DashboardContent />} />
            </Route>
          </Routes>
        </MemoryRouter>,
      );

      expect(screen.getByTestId("login-page")).toBeInTheDocument();
    });
  });

  describe("Property 5: Auth page guard for authenticated users", () => {
    test.prop([roleArrayArbitrary], { numRuns: 100 })(
      "authenticated users should be redirected away from /login",
      (roles) => {
        cleanup(); // Ensure clean DOM for each property test iteration

        const mockUser = createMockUser(roles);

        vi.mocked(useAuthStore).mockImplementation((selector) => {
          const state = {
            isAuthenticated: true,
            user: mockUser,
            token: "test-token",
            businessId: "test-business-id",
            businessTimezone: null,
            login: vi.fn(),
            updateBusinessTimezone: vi.fn(),
            updateBusinessId: vi.fn(),
            logout: vi.fn(),
          };
          return selector(state);
        });

        const { unmount } = render(
          <MemoryRouter initialEntries={["/login"]}>
            <Routes>
              <Route element={<AuthPageGuard />}>
                <Route path="/login" element={<LoginPageContent />} />
              </Route>
              <Route path="/" element={<DashboardContent />} />
              <Route path="/admin" element={<AdminContent />} />
              <Route
                path="/my-appointments"
                element={<MyAppointmentsContent />}
              />
            </Routes>
          </MemoryRouter>,
        );

        // Should NOT show login page
        expect(screen.queryByTestId("login-page")).not.toBeInTheDocument();

        unmount(); // Clean up after assertion
      },
    );

    test.prop([roleArrayArbitrary], { numRuns: 100 })(
      "authenticated users should be redirected away from /register",
      (roles) => {
        cleanup(); // Ensure clean DOM for each property test iteration

        const mockUser = createMockUser(roles);

        vi.mocked(useAuthStore).mockImplementation((selector) => {
          const state = {
            isAuthenticated: true,
            user: mockUser,
            token: "test-token",
            businessId: "test-business-id",
            businessTimezone: null,
            login: vi.fn(),
            updateBusinessTimezone: vi.fn(),
            updateBusinessId: vi.fn(),
            logout: vi.fn(),
          };
          return selector(state);
        });

        const { unmount } = render(
          <MemoryRouter initialEntries={["/register"]}>
            <Routes>
              <Route element={<AuthPageGuard />}>
                <Route path="/register" element={<RegisterPageContent />} />
              </Route>
              <Route path="/" element={<DashboardContent />} />
              <Route path="/admin" element={<AdminContent />} />
              <Route
                path="/my-appointments"
                element={<MyAppointmentsContent />}
              />
            </Routes>
          </MemoryRouter>,
        );

        // Should NOT show register page
        expect(screen.queryByTestId("register-page")).not.toBeInTheDocument();

        unmount(); // Clean up after assertion
      },
    );

    it("BUSINESS_OWNER should be redirected to / from /login", () => {
      const mockUser = createMockUser(["BUSINESS_OWNER"]);

      vi.mocked(useAuthStore).mockImplementation((selector) => {
        const state = {
          isAuthenticated: true,
          user: mockUser,
          token: "test-token",
          businessId: "test-business-id",
          businessTimezone: null,
          login: vi.fn(),
          updateBusinessTimezone: vi.fn(),
          updateBusinessId: vi.fn(),
          logout: vi.fn(),
        };
        return selector(state);
      });

      render(
        <MemoryRouter initialEntries={["/login"]}>
          <Routes>
            <Route element={<AuthPageGuard />}>
              <Route path="/login" element={<LoginPageContent />} />
            </Route>
            <Route path="/" element={<DashboardContent />} />
          </Routes>
        </MemoryRouter>,
      );

      expect(screen.getByTestId("dashboard")).toBeInTheDocument();
    });

    it("ADMIN should be redirected to /admin from /login", () => {
      const mockUser = createMockUser(["ADMIN"]);

      vi.mocked(useAuthStore).mockImplementation((selector) => {
        const state = {
          isAuthenticated: true,
          user: mockUser,
          token: "test-token",
          businessId: null,
          businessTimezone: null,
          login: vi.fn(),
          updateBusinessTimezone: vi.fn(),
          updateBusinessId: vi.fn(),
          logout: vi.fn(),
        };
        return selector(state);
      });

      render(
        <MemoryRouter initialEntries={["/login"]}>
          <Routes>
            <Route element={<AuthPageGuard />}>
              <Route path="/login" element={<LoginPageContent />} />
            </Route>
            <Route path="/admin" element={<AdminContent />} />
          </Routes>
        </MemoryRouter>,
      );

      expect(screen.getByTestId("admin")).toBeInTheDocument();
    });

    it("CUSTOMER should be redirected to /my-appointments from /login", () => {
      const mockUser = createMockUser(["CUSTOMER"]);

      vi.mocked(useAuthStore).mockImplementation((selector) => {
        const state = {
          isAuthenticated: true,
          user: mockUser,
          token: "test-token",
          businessId: null,
          businessTimezone: null,
          login: vi.fn(),
          updateBusinessTimezone: vi.fn(),
          updateBusinessId: vi.fn(),
          logout: vi.fn(),
        };
        return selector(state);
      });

      render(
        <MemoryRouter initialEntries={["/login"]}>
          <Routes>
            <Route element={<AuthPageGuard />}>
              <Route path="/login" element={<LoginPageContent />} />
            </Route>
            <Route
              path="/my-appointments"
              element={<MyAppointmentsContent />}
            />
          </Routes>
        </MemoryRouter>,
      );

      expect(screen.getByTestId("my-appointments")).toBeInTheDocument();
    });

    it("unauthenticated users should see /login page", () => {
      vi.mocked(useAuthStore).mockImplementation((selector) => {
        const state = {
          isAuthenticated: false,
          user: null,
          token: null,
          businessId: null,
          businessTimezone: null,
          login: vi.fn(),
          updateBusinessTimezone: vi.fn(),
          updateBusinessId: vi.fn(),
          logout: vi.fn(),
        };
        return selector(state);
      });

      render(
        <MemoryRouter initialEntries={["/login"]}>
          <Routes>
            <Route element={<AuthPageGuard />}>
              <Route path="/login" element={<LoginPageContent />} />
            </Route>
            <Route path="/" element={<DashboardContent />} />
          </Routes>
        </MemoryRouter>,
      );

      expect(screen.getByTestId("login-page")).toBeInTheDocument();
    });

    it("unauthenticated users should see /register page", () => {
      vi.mocked(useAuthStore).mockImplementation((selector) => {
        const state = {
          isAuthenticated: false,
          user: null,
          token: null,
          businessId: null,
          businessTimezone: null,
          login: vi.fn(),
          updateBusinessTimezone: vi.fn(),
          updateBusinessId: vi.fn(),
          logout: vi.fn(),
        };
        return selector(state);
      });

      render(
        <MemoryRouter initialEntries={["/register"]}>
          <Routes>
            <Route element={<AuthPageGuard />}>
              <Route path="/register" element={<RegisterPageContent />} />
            </Route>
            <Route path="/" element={<DashboardContent />} />
          </Routes>
        </MemoryRouter>,
      );

      expect(screen.getByTestId("register-page")).toBeInTheDocument();
    });
  });
});

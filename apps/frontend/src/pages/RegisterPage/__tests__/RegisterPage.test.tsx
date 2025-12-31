/**
 * RegisterPage Component Tests
 *
 * Unit tests for the registration page component
 *
 * Requirements: FR-1.6, NFR-4.1
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MantineProvider } from "@mantine/core";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import type { ReactNode } from "react";
import type { UserRole } from "@packages/shared-types";
import { RegisterPage } from "../ui/RegisterPage";
import { useAuthStore } from "@app/store/auth.store";

// Mock dependencies
vi.mock("@mantine/notifications", () => ({
  notifications: {
    show: vi.fn(),
  },
}));

// Mock the auth store
vi.mock("@app/store/auth.store", () => ({
  useAuthStore: vi.fn(),
}));

// Create wrapper with all providers
const createWrapper = (initialRoute = "/register") => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <MantineProvider>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[initialRoute]}>
          <Routes>
            <Route path="/register" element={children} />
            <Route path="/" element={<div>Dashboard</div>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </MantineProvider>
  );
};

describe("RegisterPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: user is not authenticated
    vi.mocked(useAuthStore).mockImplementation((selector) => {
      const state = {
        isAuthenticated: false,
        user: null,
        token: null,
        businessId: null,
        login: vi.fn(),
        updateBusinessId: vi.fn(),
        logout: vi.fn(),
      };
      return selector(state);
    });
  });

  describe("layout rendering", () => {
    it("should render the registration form", () => {
      render(<RegisterPage />, { wrapper: createWrapper() });

      // Check for form elements
      expect(
        screen.getByRole("heading", { name: "Crear Cuenta" }),
      ).toBeInTheDocument();
      expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    });

    it("should render the page title", () => {
      render(<RegisterPage />, { wrapper: createWrapper() });

      expect(
        screen.getByRole("heading", { name: "Crear Cuenta" }),
      ).toBeInTheDocument();
    });

    it("should render link to login page", () => {
      render(<RegisterPage />, { wrapper: createWrapper() });

      expect(
        screen.getByRole("link", { name: /inicia sesión/i }),
      ).toBeInTheDocument();
    });
  });

  describe("authentication redirect", () => {
    it("should redirect to dashboard if user is already authenticated", async () => {
      // Mock authenticated user
      vi.mocked(useAuthStore).mockImplementation((selector) => {
        const state = {
          isAuthenticated: true,
          user: {
            id: "user-123",
            email: "test@test.com",
            name: "Test User",
            roles: ["BUSINESS_OWNER"] as UserRole[],
            isActive: true,
            emailVerified: true,
            createdAt: new Date().toISOString(),
          },
          token: "jwt-token",
          businessId: "business-123",
          login: vi.fn(),
          updateBusinessId: vi.fn(),
          logout: vi.fn(),
        };
        return selector(state);
      });

      render(<RegisterPage />, { wrapper: createWrapper() });

      // Should redirect to dashboard
      await waitFor(() => {
        expect(screen.getByText("Dashboard")).toBeInTheDocument();
      });
    });

    it("should not redirect if user is not authenticated", () => {
      render(<RegisterPage />, { wrapper: createWrapper() });

      // Should show registration form, not dashboard
      expect(
        screen.getByRole("heading", { name: "Crear Cuenta" }),
      ).toBeInTheDocument();
      expect(screen.queryByText("Dashboard")).not.toBeInTheDocument();
    });
  });

  describe("form integration", () => {
    it("should render all form fields", () => {
      render(<RegisterPage />, { wrapper: createWrapper() });

      expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Tu contraseña")).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("Repite tu contraseña"),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("checkbox", { name: /términos/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /crear cuenta/i }),
      ).toBeInTheDocument();
    });
  });
});

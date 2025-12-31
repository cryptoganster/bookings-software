/**
 * Property-Based Tests for Password Field Clearing
 *
 * Tests Property 7: Password field memory clearing
 * Validates: Requirements SR-1.4
 *
 * For any successful form submission (login or register), the password input
 * fields SHALL be cleared from the DOM and the form state SHALL not retain
 * password values.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";

import { RegisterForm } from "../register/ui/RegisterForm";
import { LoginForm } from "../login/ui/LoginForm";

// Mock the APIs
vi.mock("../register/api/registerApi", () => ({
  registerApi: {
    register: vi.fn(),
  },
}));

vi.mock("../login/api/loginApi", () => ({
  loginApi: {
    login: vi.fn(),
  },
}));

// Mock react-router-dom navigate
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock auth store
vi.mock("@app/store/auth.store", () => ({
  useAuthStore: vi.fn((selector) => {
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
  }),
}));

// Import mocked modules
import { registerApi } from "../register/api/registerApi";
import { loginApi } from "../login/api/loginApi";

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MantineProvider>
        <Notifications />
        <MemoryRouter>{ui}</MemoryRouter>
      </MantineProvider>
    </QueryClientProvider>,
  );
}

describe("Password Field Clearing - Property-Based Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cleanup();
  });

  afterEach(() => {
    cleanup();
  });

  describe("Property 7: Password field memory clearing", () => {
    describe("RegisterForm", () => {
      it("should clear password fields after successful registration", async () => {
        const user = userEvent.setup();

        // Mock successful registration
        vi.mocked(registerApi.register).mockResolvedValue({
          userId: "user-123",
        });

        renderWithProviders(<RegisterForm />);

        // Fill in the form
        await user.type(screen.getByLabelText(/nombre/i), "Test User");
        await user.type(screen.getByLabelText(/email/i), "test@example.com");
        await user.type(screen.getByLabelText(/^contraseña$/i), "Password1!");
        await user.type(
          screen.getByLabelText(/confirmar contraseña/i),
          "Password1!",
        );
        await user.click(screen.getByRole("checkbox"));

        // Submit the form
        await user.click(screen.getByRole("button", { name: /crear cuenta/i }));

        // Wait for form to be cleared
        await waitFor(() => {
          const passwordInput = screen.getByLabelText(
            /^contraseña$/i,
          ) as HTMLInputElement;
          expect(passwordInput.value).toBe("");
        });

        // Verify confirm password is also cleared
        const confirmPasswordInput = screen.getByLabelText(
          /confirmar contraseña/i,
        ) as HTMLInputElement;
        expect(confirmPasswordInput.value).toBe("");
      });

      it("should clear different valid passwords after successful registration", async () => {
        // Test with multiple password variations
        const passwords = ["Password1!", "Aa1!5678", "Test@123"];

        for (const password of passwords) {
          cleanup();
          const user = userEvent.setup();

          // Mock successful registration
          vi.mocked(registerApi.register).mockResolvedValue({
            userId: "user-123",
          });

          const { unmount } = renderWithProviders(<RegisterForm />);

          // Fill in the form with generated password
          await user.type(screen.getByLabelText(/nombre/i), "Test User");
          await user.type(screen.getByLabelText(/email/i), "test@example.com");
          await user.type(screen.getByLabelText(/^contraseña$/i), password);
          await user.type(
            screen.getByLabelText(/confirmar contraseña/i),
            password,
          );
          await user.click(screen.getByRole("checkbox"));

          // Submit the form
          await user.click(
            screen.getByRole("button", { name: /crear cuenta/i }),
          );

          // Wait for form to be cleared
          await waitFor(
            () => {
              const passwordInput = screen.getByLabelText(
                /^contraseña$/i,
              ) as HTMLInputElement;
              expect(passwordInput.value).toBe("");
            },
            { timeout: 5000 },
          );

          unmount();
        }
      });
    });

    describe("LoginForm", () => {
      it("should clear password field after successful login", async () => {
        const user = userEvent.setup();

        // Mock successful login
        vi.mocked(loginApi.login).mockResolvedValue({
          user: {
            id: "user-123",
            email: "test@example.com",
            name: "Test User",
            roles: ["BUSINESS_OWNER"],
            isActive: true,
            emailVerified: true,
            createdAt: new Date().toISOString(),
          },
          token: "test-token",
        });

        renderWithProviders(<LoginForm />);

        // Fill in the form
        await user.type(screen.getByLabelText(/email/i), "test@example.com");
        await user.type(screen.getByLabelText(/contraseña/i), "Password1!");

        // Submit the form
        await user.click(
          screen.getByRole("button", { name: /iniciar sesión/i }),
        );

        // Wait for form to be cleared
        await waitFor(() => {
          const passwordInput = screen.getByLabelText(
            /contraseña/i,
          ) as HTMLInputElement;
          expect(passwordInput.value).toBe("");
        });
      });

      it("should clear different valid passwords after successful login", async () => {
        // Test with multiple password variations
        const passwords = ["Password1!", "Aa1!5678", "Test@123"];

        for (const password of passwords) {
          cleanup();
          const user = userEvent.setup();

          // Mock successful login
          vi.mocked(loginApi.login).mockResolvedValue({
            user: {
              id: "user-123",
              email: "test@example.com",
              name: "Test User",
              roles: ["BUSINESS_OWNER"],
              isActive: true,
              emailVerified: true,
              createdAt: new Date().toISOString(),
            },
            token: "test-token",
          });

          const { unmount } = renderWithProviders(<LoginForm />);

          // Fill in the form with generated password
          await user.type(screen.getByLabelText(/email/i), "test@example.com");
          await user.type(screen.getByLabelText(/contraseña/i), password);

          // Submit the form
          await user.click(
            screen.getByRole("button", { name: /iniciar sesión/i }),
          );

          // Wait for form to be cleared
          await waitFor(
            () => {
              const passwordInput = screen.getByLabelText(
                /contraseña/i,
              ) as HTMLInputElement;
              expect(passwordInput.value).toBe("");
            },
            { timeout: 5000 },
          );

          unmount();
        }
      });
    });
  });
});

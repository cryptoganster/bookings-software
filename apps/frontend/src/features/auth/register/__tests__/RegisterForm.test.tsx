/**
 * RegisterForm Component Tests
 *
 * Unit tests for the registration form component
 *
 * Requirements: FR-1.1, FR-1.2, FR-1.3, FR-1.6, SR-1.4
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MantineProvider } from "@mantine/core";
import { BrowserRouter } from "react-router-dom";
import type { ReactNode } from "react";
import { RegisterForm } from "../ui/RegisterForm";
import { registerApi } from "../api/registerApi";

// Mock dependencies
vi.mock("../api/registerApi");
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("@mantine/notifications", () => ({
  notifications: {
    show: vi.fn(),
  },
}));

// Create wrapper with all providers
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <MantineProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>{children}</BrowserRouter>
      </QueryClientProvider>
    </MantineProvider>
  );
};

describe("RegisterForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Helper to get password fields by placeholder
  const getPasswordField = () => screen.getByPlaceholderText("Tu contraseña");
  const getConfirmPasswordField = () =>
    screen.getByPlaceholderText("Repite tu contraseña");

  describe("rendering", () => {
    it("should render all required fields", () => {
      render(<RegisterForm />, { wrapper: createWrapper() });

      expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(getPasswordField()).toBeInTheDocument();
      expect(getConfirmPasswordField()).toBeInTheDocument();
      expect(
        screen.getByRole("checkbox", { name: /términos/i }),
      ).toBeInTheDocument();
    });

    it("should render submit button", () => {
      render(<RegisterForm />, { wrapper: createWrapper() });

      expect(
        screen.getByRole("button", { name: /crear cuenta/i }),
      ).toBeInTheDocument();
    });

    it("should render link to login page", () => {
      render(<RegisterForm />, { wrapper: createWrapper() });

      expect(screen.getByText(/¿ya tienes cuenta\?/i)).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: /inicia sesión/i }),
      ).toBeInTheDocument();
    });

    it("should render title and description", () => {
      render(<RegisterForm />, { wrapper: createWrapper() });

      expect(
        screen.getByRole("heading", { name: "Crear Cuenta" }),
      ).toBeInTheDocument();
      expect(screen.getByText(/regístrate para comenzar/i)).toBeInTheDocument();
    });
  });

  describe("validation errors", () => {
    it("should show error for empty name", async () => {
      const user = userEvent.setup();
      render(<RegisterForm />, { wrapper: createWrapper() });

      const submitButton = screen.getByRole("button", {
        name: /crear cuenta/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/el nombre es requerido/i)).toBeInTheDocument();
      });
    });

    it("should show error for invalid email", async () => {
      const user = userEvent.setup();
      render(<RegisterForm />, { wrapper: createWrapper() });

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, "invalid-email");

      const submitButton = screen.getByRole("button", {
        name: /crear cuenta/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/debe ser un email válido/i),
        ).toBeInTheDocument();
      });
    });

    it("should show error for short password", async () => {
      const user = userEvent.setup();
      render(<RegisterForm />, { wrapper: createWrapper() });

      const passwordInput = getPasswordField();
      await user.type(passwordInput, "short");

      const submitButton = screen.getByRole("button", {
        name: /crear cuenta/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/la contraseña debe tener al menos 8 caracteres/i),
        ).toBeInTheDocument();
      });
    });

    it("should show error for mismatched passwords", async () => {
      const user = userEvent.setup();
      render(<RegisterForm />, { wrapper: createWrapper() });

      const passwordInput = getPasswordField();
      const confirmInput = getConfirmPasswordField();

      await user.type(passwordInput, "SecurePass123!");
      await user.type(confirmInput, "DifferentPass123!");

      const submitButton = screen.getByRole("button", {
        name: /crear cuenta/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/las contraseñas no coinciden/i),
        ).toBeInTheDocument();
      });
    });

    it("should show error when terms not accepted", async () => {
      const user = userEvent.setup();
      render(<RegisterForm />, { wrapper: createWrapper() });

      // Fill all fields except terms
      await user.type(screen.getByLabelText(/nombre/i), "Test User");
      await user.type(screen.getByLabelText(/email/i), "test@test.com");
      await user.type(getPasswordField(), "SecurePass123!");
      await user.type(getConfirmPasswordField(), "SecurePass123!");

      const submitButton = screen.getByRole("button", {
        name: /crear cuenta/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/debes aceptar los términos y condiciones/i),
        ).toBeInTheDocument();
      });
    });
  });

  describe("password strength indicator", () => {
    it("should show password strength indicator when typing password", async () => {
      const user = userEvent.setup();
      render(<RegisterForm />, { wrapper: createWrapper() });

      const passwordInput = getPasswordField();
      await user.type(passwordInput, "test");

      await waitFor(() => {
        expect(
          screen.getByText(/fortaleza de contraseña/i),
        ).toBeInTheDocument();
      });
    });

    it("should not show password strength indicator when password is empty", () => {
      render(<RegisterForm />, { wrapper: createWrapper() });

      expect(
        screen.queryByText(/fortaleza de contraseña/i),
      ).not.toBeInTheDocument();
    });
  });

  describe("submit button states", () => {
    it("should show loading state during submission", async () => {
      const user = userEvent.setup();

      // Mock slow API response
      vi.mocked(registerApi.register).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve({ userId: "user-123" }), 500);
          }),
      );

      render(<RegisterForm />, { wrapper: createWrapper() });

      // Fill form with valid data
      await user.type(screen.getByLabelText(/nombre/i), "Test User");
      await user.type(screen.getByLabelText(/email/i), "test@test.com");
      await user.type(getPasswordField(), "SecurePass123!");
      await user.type(getConfirmPasswordField(), "SecurePass123!");
      await user.click(screen.getByRole("checkbox", { name: /términos/i }));

      const submitButton = screen.getByRole("button", {
        name: /crear cuenta/i,
      });
      await user.click(submitButton);

      // Button should show loading state
      await waitFor(() => {
        expect(submitButton).toHaveAttribute("data-loading", "true");
      });
    });

    it("should disable inputs during submission", async () => {
      const user = userEvent.setup();

      // Mock slow API response
      vi.mocked(registerApi.register).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve({ userId: "user-123" }), 500);
          }),
      );

      render(<RegisterForm />, { wrapper: createWrapper() });

      // Fill form with valid data
      await user.type(screen.getByLabelText(/nombre/i), "Test User");
      await user.type(screen.getByLabelText(/email/i), "test@test.com");
      await user.type(getPasswordField(), "SecurePass123!");
      await user.type(getConfirmPasswordField(), "SecurePass123!");
      await user.click(screen.getByRole("checkbox", { name: /términos/i }));

      const submitButton = screen.getByRole("button", {
        name: /crear cuenta/i,
      });
      await user.click(submitButton);

      // Inputs should be disabled during loading
      await waitFor(() => {
        expect(screen.getByLabelText(/nombre/i)).toBeDisabled();
        expect(screen.getByLabelText(/email/i)).toBeDisabled();
      });
    });
  });

  describe("successful submission", () => {
    it("should call register API with correct data", async () => {
      const user = userEvent.setup();
      vi.mocked(registerApi.register).mockResolvedValue({ userId: "user-123" });

      render(<RegisterForm />, { wrapper: createWrapper() });

      // Fill form with valid data
      await user.type(screen.getByLabelText(/nombre/i), "Test User");
      await user.type(screen.getByLabelText(/email/i), "test@test.com");
      await user.type(getPasswordField(), "SecurePass123!");
      await user.type(getConfirmPasswordField(), "SecurePass123!");
      await user.click(screen.getByRole("checkbox", { name: /términos/i }));

      const submitButton = screen.getByRole("button", {
        name: /crear cuenta/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(registerApi.register).toHaveBeenCalledWith({
          email: "test@test.com",
          password: "SecurePass123!",
          name: "Test User",
        });
      });
    });

    it("should clear form after successful submission", async () => {
      const user = userEvent.setup();
      vi.mocked(registerApi.register).mockResolvedValue({ userId: "user-123" });

      render(<RegisterForm />, { wrapper: createWrapper() });

      // Fill form with valid data
      const nameInput = screen.getByLabelText(/nombre/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = getPasswordField();
      const confirmInput = getConfirmPasswordField();
      const termsCheckbox = screen.getByRole("checkbox", { name: /términos/i });

      await user.type(nameInput, "Test User");
      await user.type(emailInput, "test@test.com");
      await user.type(passwordInput, "SecurePass123!");
      await user.type(confirmInput, "SecurePass123!");
      await user.click(termsCheckbox);

      const submitButton = screen.getByRole("button", {
        name: /crear cuenta/i,
      });
      await user.click(submitButton);

      // Wait for form to be cleared (SR-1.4)
      await waitFor(() => {
        expect(nameInput).toHaveValue("");
        expect(emailInput).toHaveValue("");
        expect(passwordInput).toHaveValue("");
        expect(confirmInput).toHaveValue("");
        expect(termsCheckbox).not.toBeChecked();
      });
    });
  });

  describe("navigation links", () => {
    it("should have correct href for login link", () => {
      render(<RegisterForm />, { wrapper: createWrapper() });

      const loginLink = screen.getByRole("link", { name: /inicia sesión/i });
      expect(loginLink).toHaveAttribute("href", "/login");
    });

    it("should have correct href for terms link", () => {
      render(<RegisterForm />, { wrapper: createWrapper() });

      const termsLink = screen.getByRole("link", {
        name: /términos y condiciones/i,
      });
      expect(termsLink).toHaveAttribute("href", "/terms");
    });
  });
});

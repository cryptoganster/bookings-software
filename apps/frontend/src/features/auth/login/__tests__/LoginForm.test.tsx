import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MantineProvider } from "@mantine/core";
import { BrowserRouter } from "react-router-dom";
import type { ReactNode } from "react";
import type { LoginResponseDto, UserRole } from "@packages/shared-types";
import { LoginForm } from "../ui/LoginForm";
import { loginApi } from "../api/loginApi";

// Mock dependencies
vi.mock("../api/loginApi");
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => vi.fn(),
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

describe("LoginForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render login form with all fields", () => {
    const Wrapper = createWrapper();
    render(<LoginForm />, { wrapper: Wrapper });

    expect(
      screen.getByRole("heading", { name: /iniciar sesión/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /iniciar sesión/i }),
    ).toBeInTheDocument();
  });

  it("should not call API with invalid email", async () => {
    const user = userEvent.setup();
    const Wrapper = createWrapper();
    render(<LoginForm />, { wrapper: Wrapper });

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/contraseña/i);
    const submitButton = screen.getByRole("button", {
      name: /iniciar sesión/i,
    });

    // Enter invalid email but valid password
    await user.type(emailInput, "invalid-email");
    await user.type(passwordInput, "password123");
    await user.click(submitButton);

    // API should not be called with invalid email
    await waitFor(() => {
      expect(loginApi.login).not.toHaveBeenCalled();
    });
  });

  it("should show validation error for short password", async () => {
    const user = userEvent.setup();
    const Wrapper = createWrapper();
    render(<LoginForm />, { wrapper: Wrapper });

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/contraseña/i);
    const submitButton = screen.getByRole("button", {
      name: /iniciar sesión/i,
    });

    // Enter valid email but short password
    await user.type(emailInput, "test@test.com");
    await user.type(passwordInput, "123");
    await user.click(submitButton);

    // Wait for validation error
    await waitFor(() => {
      expect(
        screen.getByText(/la contraseña debe tener al menos 6 caracteres/i),
      ).toBeInTheDocument();
    });
  });

  it("should call login API with correct credentials", async () => {
    const user = userEvent.setup();
    const mockResponse: LoginResponseDto = {
      user: {
        id: "user-123",
        email: "test@test.com",
        name: "Test User",
        roles: ["BUSINESS_OWNER"] as UserRole[],
        isActive: true,
        emailVerified: true,
        createdAt: new Date().toISOString(),
      },
      token: "jwt-token-123",
    };

    vi.mocked(loginApi.login).mockResolvedValue(mockResponse);

    const Wrapper = createWrapper();
    render(<LoginForm />, { wrapper: Wrapper });

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/contraseña/i);
    const submitButton = screen.getByRole("button", {
      name: /iniciar sesión/i,
    });

    // Fill form with valid data
    await user.type(emailInput, "test@test.com");
    await user.type(passwordInput, "password123");
    await user.click(submitButton);

    // Verify API was called with correct data
    await waitFor(() => {
      expect(loginApi.login).toHaveBeenCalledWith({
        email: "test@test.com",
        password: "password123",
      });
    });
  });

  it("should disable form fields during submission", async () => {
    const user = userEvent.setup();

    // Mock slow API response
    vi.mocked(loginApi.login).mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(
            () =>
              resolve({
                user: {
                  id: "user-123",
                  email: "test@test.com",
                  name: "Test User",
                  roles: ["BUSINESS_OWNER"],
                  isActive: true,
                  emailVerified: true,
                  createdAt: new Date().toISOString(),
                },
                token: "jwt-token-123",
              }),
            100,
          );
        }),
    );

    const Wrapper = createWrapper();
    render(<LoginForm />, { wrapper: Wrapper });

    const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
    const passwordInput = screen.getByLabelText(
      /contraseña/i,
    ) as HTMLInputElement;
    const submitButton = screen.getByRole("button", {
      name: /iniciar sesión/i,
    });

    // Fill and submit form
    await user.type(emailInput, "test@test.com");
    await user.type(passwordInput, "password123");
    await user.click(submitButton);

    // Fields should be disabled during submission
    await waitFor(() => {
      expect(emailInput.disabled).toBe(true);
      expect(passwordInput.disabled).toBe(true);
    });
  });

  it("should not submit form with empty fields", async () => {
    const user = userEvent.setup();
    const Wrapper = createWrapper();
    render(<LoginForm />, { wrapper: Wrapper });

    const submitButton = screen.getByRole("button", {
      name: /iniciar sesión/i,
    });

    // Try to submit without filling fields
    await user.click(submitButton);

    // API should not be called
    expect(loginApi.login).not.toHaveBeenCalled();
  });

  it("should render link to registration page", () => {
    const Wrapper = createWrapper();
    render(<LoginForm />, { wrapper: Wrapper });

    expect(screen.getByText(/¿no tienes cuenta\?/i)).toBeInTheDocument();
    const registerLink = screen.getByRole("link", { name: /regístrate/i });
    expect(registerLink).toBeInTheDocument();
    expect(registerLink).toHaveAttribute("href", "/register");
  });
});

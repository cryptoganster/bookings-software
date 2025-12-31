/**
 * Property-Based Tests for Terms Acceptance Validation
 *
 * Tests Property 8: Terms acceptance requirement
 * Validates: Requirements PCR-1.2
 *
 * For any registration attempt, the form SHALL NOT submit successfully
 * unless the terms acceptance checkbox is checked.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";

import { RegisterForm } from "../ui/RegisterForm";

// Mock the API
vi.mock("../api/registerApi", () => ({
  registerApi: {
    register: vi.fn(),
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

// Import mocked module
import { registerApi } from "../api/registerApi";

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

describe("Terms Acceptance - Property-Based Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cleanup();
  });

  afterEach(() => {
    cleanup();
  });

  describe("Property 8: Terms acceptance requirement", () => {
    it("should show validation error when terms are not accepted", async () => {
      const user = userEvent.setup();

      renderWithProviders(<RegisterForm />);

      // Fill in all fields except terms
      await user.type(screen.getByLabelText(/nombre/i), "Test User");
      await user.type(screen.getByLabelText(/email/i), "test@example.com");
      await user.type(screen.getByLabelText(/^contraseña$/i), "Password1!");
      await user.type(
        screen.getByLabelText(/confirmar contraseña/i),
        "Password1!",
      );

      // Submit without accepting terms
      await user.click(screen.getByRole("button", { name: /crear cuenta/i }));

      // Should show validation error
      await waitFor(() => {
        expect(
          screen.getByText(/debes aceptar los términos/i),
        ).toBeInTheDocument();
      });

      // API should NOT have been called
      expect(registerApi.register).not.toHaveBeenCalled();
    });

    it("should allow submission when terms are accepted", async () => {
      const user = userEvent.setup();

      // Mock successful registration
      vi.mocked(registerApi.register).mockResolvedValue({ userId: "user-123" });

      renderWithProviders(<RegisterForm />);

      // Fill in all fields including terms
      await user.type(screen.getByLabelText(/nombre/i), "Test User");
      await user.type(screen.getByLabelText(/email/i), "test@example.com");
      await user.type(screen.getByLabelText(/^contraseña$/i), "Password1!");
      await user.type(
        screen.getByLabelText(/confirmar contraseña/i),
        "Password1!",
      );
      await user.click(screen.getByRole("checkbox"));

      // Submit with terms accepted
      await user.click(screen.getByRole("button", { name: /crear cuenta/i }));

      // API should have been called
      await waitFor(() => {
        expect(registerApi.register).toHaveBeenCalledWith({
          email: "test@example.com",
          password: "Password1!",
          name: "Test User",
        });
      });
    });

    it("should NOT call API when terms are not accepted for various valid form data", async () => {
      // Test with multiple form data variations
      const testCases = [
        { name: "John Doe", email: "john@example.com", password: "Password1!" },
        { name: "Jane Smith", email: "jane@test.org", password: "Aa1!5678" },
        { name: "Test User", email: "test@gmail.com", password: "Test@123" },
      ];

      for (const testCase of testCases) {
        cleanup();
        const user = userEvent.setup();

        // Reset mock
        vi.mocked(registerApi.register).mockClear();

        const { unmount } = renderWithProviders(<RegisterForm />);

        // Fill in all fields except terms
        await user.type(screen.getByLabelText(/nombre/i), testCase.name);
        await user.type(screen.getByLabelText(/email/i), testCase.email);
        await user.type(
          screen.getByLabelText(/^contraseña$/i),
          testCase.password,
        );
        await user.type(
          screen.getByLabelText(/confirmar contraseña/i),
          testCase.password,
        );

        // Submit without accepting terms
        await user.click(screen.getByRole("button", { name: /crear cuenta/i }));

        // Wait for validation to complete
        await waitFor(
          () => {
            expect(
              screen.getByText(/debes aceptar los términos/i),
            ).toBeInTheDocument();
          },
          { timeout: 5000 },
        );

        // API should NOT have been called
        expect(registerApi.register).not.toHaveBeenCalled();

        unmount();
      }
    });

    it("should call API when terms ARE accepted for various valid form data", async () => {
      // Test with multiple form data variations
      const testCases = [
        { name: "John Doe", email: "john@example.com", password: "Password1!" },
        { name: "Jane Smith", email: "jane@test.org", password: "Aa1!5678" },
        { name: "Test User", email: "test@gmail.com", password: "Test@123" },
      ];

      for (const testCase of testCases) {
        cleanup();
        const user = userEvent.setup();

        // Mock successful registration
        vi.mocked(registerApi.register).mockResolvedValue({
          userId: "user-123",
        });

        const { unmount } = renderWithProviders(<RegisterForm />);

        // Fill in all fields including terms
        await user.type(screen.getByLabelText(/nombre/i), testCase.name);
        await user.type(screen.getByLabelText(/email/i), testCase.email);
        await user.type(
          screen.getByLabelText(/^contraseña$/i),
          testCase.password,
        );
        await user.type(
          screen.getByLabelText(/confirmar contraseña/i),
          testCase.password,
        );
        await user.click(screen.getByRole("checkbox"));

        // Submit with terms accepted
        await user.click(screen.getByRole("button", { name: /crear cuenta/i }));

        // API should have been called
        await waitFor(
          () => {
            expect(registerApi.register).toHaveBeenCalledWith({
              email: testCase.email,
              password: testCase.password,
              name: testCase.name,
            });
          },
          { timeout: 5000 },
        );

        unmount();
      }
    });
  });
});

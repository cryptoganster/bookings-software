/**
 * useRegister Hook Tests
 *
 * Unit tests for the registration mutation hook
 *
 * Requirements: FR-1.1, FR-1.4, FR-1.5
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MantineProvider } from "@mantine/core";
import { BrowserRouter } from "react-router-dom";
import type { ReactNode } from "react";
import { useRegister } from "../model/useRegister";
import { registerApi } from "../api/registerApi";
import { notifications } from "@mantine/notifications";

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

// Mock notifications
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

describe("useRegister", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call registerApi with correct data", async () => {
    const mockResponse = { userId: "user-123" };
    vi.mocked(registerApi.register).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useRegister(), {
      wrapper: createWrapper(),
    });

    const registerData = {
      email: "test@test.com",
      password: "SecurePass123!",
      name: "Test User",
    };

    result.current.mutate(registerData);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(registerApi.register).toHaveBeenCalledWith(registerData);
  });

  it("should navigate to /login on successful registration", async () => {
    const mockResponse = { userId: "user-123" };
    vi.mocked(registerApi.register).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useRegister(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      email: "test@test.com",
      password: "SecurePass123!",
      name: "Test User",
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockNavigate).toHaveBeenCalledWith("/login");
  });

  it("should show success notification on successful registration", async () => {
    const mockResponse = { userId: "user-123" };
    vi.mocked(registerApi.register).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useRegister(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      email: "test@test.com",
      password: "SecurePass123!",
      name: "Test User",
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(notifications.show).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Registro exitoso",
        color: "green",
      }),
    );
  });

  it("should handle 409 error (email already exists)", async () => {
    const mockError = {
      response: {
        status: 409,
        data: {
          message: "Email already exists",
        },
      },
    };

    vi.mocked(registerApi.register).mockRejectedValue(mockError);

    const { result } = renderHook(() => useRegister(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      email: "existing@test.com",
      password: "SecurePass123!",
      name: "Test User",
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(notifications.show).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Error de registro",
        message: "Este email ya está registrado",
        color: "red",
      }),
    );

    // Should NOT navigate on error
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("should handle 400 error (validation error)", async () => {
    const mockError = {
      response: {
        status: 400,
        data: {
          message: ["Password too weak", "Name is required"],
        },
      },
    };

    vi.mocked(registerApi.register).mockRejectedValue(mockError);

    const { result } = renderHook(() => useRegister(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      email: "test@test.com",
      password: "weak",
      name: "",
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(notifications.show).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Error de registro",
        message: "Password too weak, Name is required",
        color: "red",
      }),
    );
  });

  it("should handle 429 error (rate limiting)", async () => {
    const mockError = {
      response: {
        status: 429,
        data: {
          message: "Too many requests",
        },
      },
    };

    vi.mocked(registerApi.register).mockRejectedValue(mockError);

    const { result } = renderHook(() => useRegister(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      email: "test@test.com",
      password: "SecurePass123!",
      name: "Test User",
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(notifications.show).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Error de registro",
        message: "Demasiados intentos. Intenta más tarde.",
        color: "red",
      }),
    );
  });

  it("should handle generic server error", async () => {
    const mockError = {
      response: {
        status: 500,
        data: {
          message: "Internal server error",
        },
      },
    };

    vi.mocked(registerApi.register).mockRejectedValue(mockError);

    const { result } = renderHook(() => useRegister(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      email: "test@test.com",
      password: "SecurePass123!",
      name: "Test User",
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(notifications.show).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Error de registro",
        color: "red",
      }),
    );
  });

  it("should set isPending to true during registration", async () => {
    vi.mocked(registerApi.register).mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve({ userId: "user-123" }), 100);
        }),
    );

    const { result } = renderHook(() => useRegister(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      email: "test@test.com",
      password: "SecurePass123!",
      name: "Test User",
    });

    // Wait for pending state
    await waitFor(() => {
      expect(result.current.isPending).toBe(true);
    });

    // Wait for success
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Should not be pending after success
    expect(result.current.isPending).toBe(false);
  });

  it("should handle network error", async () => {
    const mockError = new Error("Network Error");

    vi.mocked(registerApi.register).mockRejectedValue(mockError);

    const { result } = renderHook(() => useRegister(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      email: "test@test.com",
      password: "SecurePass123!",
      name: "Test User",
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(notifications.show).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Error de registro",
        message: "Error al registrarse. Intenta nuevamente.",
        color: "red",
      }),
    );
  });
});

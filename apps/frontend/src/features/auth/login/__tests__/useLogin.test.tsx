import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MantineProvider } from "@mantine/core";
import { BrowserRouter } from "react-router-dom";
import type { ReactNode } from "react";
import { useLogin } from "../model/useLogin";
import { useAuthStore } from "@app/store/auth.store";
import { loginApi } from "../api/loginApi";
import type { LoginResponseDto } from "@packages/shared-types";

// Mock dependencies
vi.mock("../api/loginApi");
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

describe("useLogin", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset auth store to initial state
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
    });
  });

  it("should update auth store on successful login", async () => {
    const mockResponse: LoginResponseDto = {
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
    };

    vi.mocked(loginApi.login).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useLogin(), {
      wrapper: createWrapper(),
    });

    // Execute login
    result.current.mutate({
      email: "test@test.com",
      password: "password123",
    });

    // Wait for mutation to complete
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Verify auth store was updated
    const authState = useAuthStore.getState();
    expect(authState.user).toEqual(mockResponse.user);
    expect(authState.token).toBe(mockResponse.token);
    expect(authState.isAuthenticated).toBe(true);
  });

  it("should navigate to dashboard on successful login", async () => {
    const mockResponse: LoginResponseDto = {
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
    };

    vi.mocked(loginApi.login).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useLogin(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      email: "test@test.com",
      password: "password123",
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Verify navigation to dashboard
    expect(mockNavigate).toHaveBeenCalledWith("/");
  });

  it("should handle login error", async () => {
    const mockError = {
      response: {
        status: 401,
        data: {
          message: "Invalid credentials",
        },
      },
    };

    vi.mocked(loginApi.login).mockRejectedValue(mockError);

    const { result } = renderHook(() => useLogin(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      email: "wrong@test.com",
      password: "wrongpassword",
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // Verify auth store was NOT updated
    const authState = useAuthStore.getState();
    expect(authState.user).toBeNull();
    expect(authState.token).toBeNull();
    expect(authState.isAuthenticated).toBe(false);
  });

  it("should set isPending to true during login", async () => {
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

    const { result } = renderHook(() => useLogin(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      email: "test@test.com",
      password: "password123",
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
});

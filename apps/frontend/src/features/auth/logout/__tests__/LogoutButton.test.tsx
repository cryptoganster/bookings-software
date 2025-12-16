import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { MantineProvider } from "@mantine/core";
import { LogoutButton } from "../ui/LogoutButton";
import { useAuthStore } from "@app/store/auth.store";

// Mock the navigate function
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Helper to render with providers
const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <MantineProvider>
      <BrowserRouter>{component}</BrowserRouter>
    </MantineProvider>,
  );
};

describe("LogoutButton", () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();

    // Reset auth store to initial state
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
    });
  });

  it("should render logout button with correct text", () => {
    renderWithProviders(<LogoutButton />);

    expect(screen.getByText("Cerrar Sesión")).toBeInTheDocument();
  });

  it("should clear auth state when clicked", () => {
    // Set up authenticated state
    useAuthStore.setState({
      user: {
        id: "1",
        email: "test@test.com",
        name: "Test User",
        businessId: "business-1",
        createdAt: new Date().toISOString(),
      },
      token: "test-token",
      isAuthenticated: true,
    });

    renderWithProviders(<LogoutButton />);

    const button = screen.getByText("Cerrar Sesión");
    fireEvent.click(button);

    // Verify logout was called (state should be cleared)
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it("should navigate to login page when clicked", () => {
    renderWithProviders(<LogoutButton />);

    const button = screen.getByText("Cerrar Sesión");
    fireEvent.click(button);

    // Verify navigation to login with replace
    expect(mockNavigate).toHaveBeenCalledWith("/login", { replace: true });
  });

  it("should render with custom variant", () => {
    renderWithProviders(<LogoutButton variant="subtle" />);

    const button = screen.getByText("Cerrar Sesión");
    expect(button).toBeInTheDocument();
  });

  it("should render with custom size", () => {
    renderWithProviders(<LogoutButton size="md" />);

    const button = screen.getByText("Cerrar Sesión");
    expect(button).toBeInTheDocument();
  });
});

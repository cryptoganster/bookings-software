import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserDto } from "@packages/shared-types";

/**
 * Auth Store State
 *
 * Manages authentication state including user data, JWT token, and auth status.
 * Uses Zustand persist middleware to save state to localStorage.
 *
 * Note: isAuthenticated is computed from token presence.
 * This ensures authentication state persists correctly across page reloads.
 */
interface AuthState {
  // State
  user: UserDto | null;
  token: string | null;
  isAuthenticated: boolean;

  // Actions
  login: (user: UserDto, token: string) => void;
  logout: () => void;
}

/**
 * Auth Store
 *
 * Global authentication state management with persistence.
 *
 * @example
 * ```tsx
 * const { user, token, isAuthenticated, login, logout } = useAuthStore();
 *
 * // Login
 * login(userData, jwtToken);
 *
 * // Logout
 * logout();
 *
 * // Check auth status
 * if (isAuthenticated) {
 *   // User is logged in
 * }
 * ```
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // Initial state
      user: null,
      token: null,
      isAuthenticated: false,

      // Login action - updates token and derives isAuthenticated
      login: (user, token) =>
        set({
          user,
          token,
          isAuthenticated: !!token,
        }),

      // Logout action - clears all auth state
      logout: () =>
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: "auth-storage", // localStorage key
      partialize: (state) => ({
        token: state.token,
        user: state.user,
      }), // Only persist token and user - isAuthenticated is computed on hydration
      onRehydrateStorage: () => (state) => {
        // After rehydration, compute isAuthenticated from token
        if (state) {
          state.isAuthenticated = !!state.token;
        }
      },
    },
  ),
);

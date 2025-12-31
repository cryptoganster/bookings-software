import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { env } from "@shared/config/env";
import { logger } from "@shared/lib/logger";
import { useAuthStore } from "@app/store/auth.store";

/**
 * Axios instance configured for the backend API
 * Includes request/response interceptors for authentication and error handling
 */
export const apiClient = axios.create({
  baseURL: env.apiUrl,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Request interceptor - adds JWT token to requests
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get token from Zustand store (works outside React components)
    const token = useAuthStore.getState().token;

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

/**
 * Handle 401 Unauthorized - token expired or invalid
 *
 * Clears auth state and redirects to login page.
 * This function is exported for testing purposes.
 */
export function handleUnauthorized(): void {
  // Clear auth store state (this also clears localStorage via persist middleware)
  useAuthStore.getState().logout();

  // Redirect to login page
  window.location.href = "/login";
}

/**
 * Response interceptor - handles common error scenarios
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Handle 401 Unauthorized - token expired or invalid
    if (error.response?.status === 401) {
      // Don't redirect if already on login page or if it's a login request
      const isLoginRequest = error.config?.url?.includes("/auth/login");
      const isOnLoginPage = window.location.pathname === "/login";

      if (!isLoginRequest && !isOnLoginPage) {
        logger.warn("Token expired or invalid, redirecting to login");
        handleUnauthorized();
      }
    }

    // Handle 404 Not Found
    if (error.response?.status === 404) {
      logger.error("Resource not found", { url: error.config?.url });
    }

    // Handle 500 Server Error
    if (error.response?.status && error.response.status >= 500) {
      logger.error("Server error", {
        message: error.message,
        status: error.response?.status,
      });
    }

    return Promise.reject(error);
  },
);

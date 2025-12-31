/**
 * useLogin Hook
 *
 * Hook de mutation para manejar el proceso de login
 * Integra TanStack Query con el auth store de Zustand
 */

import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { notifications } from "@mantine/notifications";
import type { AxiosError } from "axios";

import { loginApi } from "../api/loginApi";
import { useAuthStore } from "@app/store/auth.store";
import type { LoginDto } from "@entities/user";
import type { ApiErrorDto, UserRole } from "@packages/shared-types";
import { logger } from "@shared/lib/logger";

/**
 * Get redirect path based on user roles
 *
 * Priority:
 * 1. BUSINESS_OWNER -> / (dashboard)
 * 2. ADMIN -> /admin (future route)
 * 3. CUSTOMER -> /my-appointments (future route)
 * 4. Default -> / (dashboard)
 *
 * @param roles - Array of user roles
 * @returns Redirect path
 */
export function getRedirectPathForRoles(roles: UserRole[]): string {
  // BUSINESS_OWNER has highest priority
  if (roles.includes("BUSINESS_OWNER")) {
    return "/";
  }

  // ADMIN has second priority
  if (roles.includes("ADMIN")) {
    return "/admin";
  }

  // CUSTOMER has third priority
  if (roles.includes("CUSTOMER")) {
    return "/my-appointments";
  }

  // Default fallback to dashboard
  return "/";
}

/**
 * Decode JWT token to extract payload
 * Note: This is a simple base64 decode, not cryptographic verification
 * The backend verifies the token signature
 */
function decodeJWT(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return null;
    }
    const payload = parts[1];
    const decoded = atob(payload);
    return JSON.parse(decoded);
  } catch (error) {
    logger.error("Failed to decode JWT token", { error });
    return null;
  }
}

/**
 * Hook para realizar login
 *
 * Maneja:
 * - Llamada a la API de login
 * - Decodificación del JWT para extraer businessId
 * - Actualización del auth store con usuario, token y businessId
 * - Redirección al dashboard después de login exitoso
 * - Notificaciones de error
 *
 * @example
 * ```tsx
 * const { mutate: login, isPending } = useLogin();
 *
 * const handleSubmit = (data: LoginFormData) => {
 *   login(data);
 * };
 * ```
 */
export function useLogin() {
  const navigate = useNavigate();
  const authLogin = useAuthStore((state) => state.login);

  return useMutation({
    mutationFn: (credentials: LoginDto) => loginApi.login(credentials),

    onSuccess: (data) => {
      // Decode JWT to extract businessId
      const payload = decodeJWT(data.token);
      const businessId: string | null =
        payload && typeof payload.businessId === "string"
          ? payload.businessId
          : null;

      logger.info("Login successful", {
        userId: data.user.id,
        roles: data.user.roles,
        hasBusinessId: !!businessId,
      });

      // Actualizar auth store con usuario, token y businessId
      authLogin(data.user, data.token, businessId);

      // Mostrar notificación de éxito
      notifications.show({
        title: "Bienvenido",
        message: `Hola ${data.user.name}!`,
        color: "green",
      });

      // Redirigir basado en roles del usuario
      const redirectPath = getRedirectPathForRoles(data.user.roles);
      logger.info("Redirecting after login", {
        redirectPath,
        roles: data.user.roles,
      });
      navigate(redirectPath);
    },

    onError: (error: AxiosError<ApiErrorDto>) => {
      // Manejar diferentes tipos de errores
      let errorMessage = "Error al iniciar sesión. Intenta nuevamente.";

      if (error.response?.status === 401) {
        errorMessage = "Email o contraseña incorrectos";
      } else if (error.response?.status === 429) {
        errorMessage = "Demasiados intentos. Intenta más tarde.";
      } else if (error.response?.data?.message) {
        // Usar mensaje del servidor si está disponible
        const serverMessage = error.response.data.message;
        errorMessage = Array.isArray(serverMessage)
          ? serverMessage.join(", ")
          : serverMessage;
      }

      logger.warn("Login failed", {
        status: error.response?.status,
        message: errorMessage,
      });

      // Mostrar notificación de error
      notifications.show({
        title: "Error de autenticación",
        message: errorMessage,
        color: "red",
      });
    },
  });
}

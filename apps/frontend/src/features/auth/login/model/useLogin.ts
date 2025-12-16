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
import type { ApiErrorDto } from "@packages/shared-types";

/**
 * Hook para realizar login
 *
 * Maneja:
 * - Llamada a la API de login
 * - Actualización del auth store con usuario y token
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
      // Actualizar auth store con usuario y token
      authLogin(data.user, data.token);

      // Mostrar notificación de éxito
      notifications.show({
        title: "Bienvenido",
        message: `Hola ${data.user.name}!`,
        color: "green",
      });

      // Redirigir al dashboard
      navigate("/");
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

      // Mostrar notificación de error
      notifications.show({
        title: "Error de autenticación",
        message: errorMessage,
        color: "red",
      });
    },
  });
}

/**
 * useRegister Hook
 *
 * Hook de mutation para manejar el proceso de registro
 * Integra TanStack Query con navegación y notificaciones
 *
 * Requirements: FR-1.1, FR-1.4, FR-1.5
 */

import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { notifications } from "@mantine/notifications";
import type { AxiosError } from "axios";

import { registerApi, type RegisterDto } from "../api/registerApi";
import type { ApiErrorDto } from "@packages/shared-types";
import { logger } from "@shared/lib/logger";

/**
 * Hook para realizar registro de usuario
 *
 * Maneja:
 * - Llamada a la API de registro
 * - Notificación de éxito con instrucciones
 * - Redirección a login después de registro exitoso
 * - Manejo de errores específicos (409, 400, 429)
 *
 * @example
 * ```tsx
 * const { mutate: register, isPending } = useRegister();
 *
 * const handleSubmit = (data: RegisterFormData) => {
 *   // Extraer solo los campos necesarios para la API
 *   register({
 *     email: data.email,
 *     password: data.password,
 *     name: data.name,
 *   });
 * };
 * ```
 */
export function useRegister() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (data: RegisterDto) => registerApi.register(data),

    onSuccess: (data) => {
      logger.info("Registration successful", {
        userId: data.userId,
      });

      // Mostrar notificación de éxito
      notifications.show({
        title: "Registro exitoso",
        message:
          "Tu cuenta ha sido creada. Por favor inicia sesión para continuar.",
        color: "green",
        autoClose: 5000,
      });

      // Redirigir a login
      navigate("/login");
    },

    onError: (error: AxiosError<ApiErrorDto>) => {
      // Manejar diferentes tipos de errores
      let errorMessage = "Error al registrarse. Intenta nuevamente.";

      if (error.response?.status === 409) {
        // Email ya existe
        errorMessage = "Este email ya está registrado";
      } else if (error.response?.status === 400) {
        // Error de validación del servidor
        const serverMessage = error.response.data?.message;
        errorMessage = Array.isArray(serverMessage)
          ? serverMessage.join(", ")
          : serverMessage || errorMessage;
      } else if (error.response?.status === 429) {
        // Rate limiting
        errorMessage = "Demasiados intentos. Intenta más tarde.";
      } else if (error.response?.data?.message) {
        // Otro error con mensaje del servidor
        const serverMessage = error.response.data.message;
        errorMessage = Array.isArray(serverMessage)
          ? serverMessage.join(", ")
          : serverMessage;
      }

      logger.warn("Registration failed", {
        status: error.response?.status,
        message: errorMessage,
      });

      // Mostrar notificación de error
      notifications.show({
        title: "Error de registro",
        message: errorMessage,
        color: "red",
      });
    },
  });
}

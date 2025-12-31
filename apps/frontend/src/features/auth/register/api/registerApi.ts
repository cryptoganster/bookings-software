/**
 * Register API
 *
 * Funciones para interactuar con el endpoint de registro
 *
 * Requirements: FR-1.1
 */

import { apiClient } from "@shared/api/client";
import { ENDPOINTS } from "@shared/api/endpoints";
import type { RegisterRequestDto } from "@packages/shared-types";

/**
 * Respuesta del endpoint de registro
 */
export interface RegisterResponse {
  userId: string;
}

/**
 * DTO para el request de registro (sin confirmPassword y acceptTerms)
 * Estos campos son solo para validación del formulario
 */
export type RegisterDto = RegisterRequestDto;

/**
 * Registra un nuevo usuario
 *
 * @param data - Email, password y nombre del usuario
 * @returns Respuesta con el ID del usuario creado
 * @throws AxiosError si el email ya existe (409), datos inválidos (400), o error de red
 *
 * @example
 * ```ts
 * const response = await register({
 *   email: "user@example.com",
 *   password: "SecurePass123!",
 *   name: "John Doe"
 * });
 * console.log(response.userId);
 * ```
 */
export async function register(data: RegisterDto): Promise<RegisterResponse> {
  const { data: response } = await apiClient.post<RegisterResponse>(
    ENDPOINTS.AUTH.REGISTER,
    data,
  );

  return response;
}

/**
 * API object para registro
 * Facilita el testing y la organización
 */
export const registerApi = {
  register,
} as const;

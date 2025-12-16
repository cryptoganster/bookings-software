/**
 * Login API
 *
 * Funciones para interactuar con el endpoint de autenticación
 */

import { apiClient } from "@shared/api/client";
import { ENDPOINTS } from "@shared/api/endpoints";
import type { LoginDto, LoginResponse } from "@entities/user";

/**
 * Realiza el login del usuario
 *
 * @param credentials - Email y password del usuario
 * @returns Respuesta con usuario y token JWT
 * @throws AxiosError si las credenciales son inválidas o hay error de red
 */
export async function login(credentials: LoginDto): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>(
    ENDPOINTS.AUTH.LOGIN,
    credentials,
  );

  return data;
}

/**
 * API object para login
 * Facilita el testing y la organización
 */
export const loginApi = {
  login,
} as const;

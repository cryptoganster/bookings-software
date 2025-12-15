/**
 * User Entity Types
 * 
 * Este módulo define los tipos relacionados con el usuario.
 * Los tipos principales se importan desde @packages/shared-types
 * para mantener consistencia con el contrato de API.
 */

import type { UserDto, LoginRequestDto, LoginResponseDto } from '@packages/shared-types';

/**
 * User - Representa un usuario en el sistema
 * Importado desde shared-types para mantener consistencia con el backend
 */
export type User = UserDto;

/**
 * LoginDto - DTO para el request de login
 * Importado desde shared-types
 */
export type LoginDto = LoginRequestDto;

/**
 * LoginResponse - Respuesta del endpoint de login
 * Importado desde shared-types
 */
export type LoginResponse = LoginResponseDto;

/**
 * UserPayload - Payload del JWT token decodificado
 * Usado internamente en el frontend para el estado de autenticación
 */
export interface UserPayload {
  userId: string;
  email: string;
  businessId: string | null;
}

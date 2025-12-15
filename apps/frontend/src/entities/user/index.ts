/**
 * User Entity - Public API
 * 
 * Este archivo expone la API pública del entity User.
 * Siguiendo Feature-Sliced Design, solo se exportan los elementos
 * que deben ser accesibles desde otras capas.
 */

// Types
export type { User, LoginDto, LoginResponse, UserPayload } from './model/types';

// Query Keys
export { userKeys } from './model/queries';

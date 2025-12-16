/**
 * Login Feature - Public API
 *
 * Expone solo los elementos que deben ser accesibles desde otras capas
 * siguiendo Feature-Sliced Design
 */

// UI Components
export { LoginForm } from "./ui/LoginForm";

// Hooks
export { useLogin } from "./model/useLogin";

// Types (si se necesitan en otras capas)
export type { LoginFormData } from "./model/schema";

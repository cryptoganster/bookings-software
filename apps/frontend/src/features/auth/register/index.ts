/**
 * Register Feature - Public API
 *
 * Expone solo los elementos que deben ser accesibles desde otras capas
 * siguiendo Feature-Sliced Design
 */

// UI Components
export { RegisterForm } from "./ui/RegisterForm";
export { PasswordStrengthIndicator } from "./ui/PasswordStrengthIndicator";

// Hooks
export { useRegister } from "./model/useRegister";

// Types (si se necesitan en otras capas)
export type { RegisterFormData } from "./model/schema";

// Utilities
export { calculatePasswordStrength } from "./model/passwordStrength";
export type { StrengthResult, StrengthLevel } from "./model/passwordStrength";

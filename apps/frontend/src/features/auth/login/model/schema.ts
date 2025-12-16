/**
 * Login Form Validation Schema
 *
 * Define el schema de validación para el formulario de login usando Zod
 */

import { z } from "zod";

/**
 * Schema de validación para el formulario de login
 *
 * Reglas:
 * - Email: debe ser un email válido
 * - Password: mínimo 6 caracteres
 */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "El email es requerido")
    .email("Debe ser un email válido"),

  password: z
    .string()
    .min(1, "La contraseña es requerida")
    .min(6, "La contraseña debe tener al menos 6 caracteres"),
});

/**
 * Tipo inferido del schema de login
 * Usado en React Hook Form
 */
export type LoginFormData = z.infer<typeof loginSchema>;

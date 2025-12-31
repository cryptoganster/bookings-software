/**
 * Register Form Validation Schema
 *
 * Define el schema de validación para el formulario de registro usando Zod
 *
 * Reglas de validación:
 * - Email: requerido, formato válido
 * - Password: mínimo 8 caracteres, mayúscula, minúscula, número, carácter especial
 * - Confirm Password: debe coincidir con password
 * - Name: entre 2 y 100 caracteres
 * - Accept Terms: debe ser true
 */

import { z } from "zod";

/**
 * Schema de validación para el formulario de registro
 */
export const registerSchema = z
  .object({
    email: z
      .string()
      .min(1, "El email es requerido")
      .email("Debe ser un email válido"),

    password: z
      .string()
      .min(1, "La contraseña es requerida")
      .min(8, "La contraseña debe tener al menos 8 caracteres")
      .regex(/[A-Z]/, "La contraseña debe contener al menos una mayúscula")
      .regex(/[a-z]/, "La contraseña debe contener al menos una minúscula")
      .regex(/[0-9]/, "La contraseña debe contener al menos un número")
      .regex(
        /[!@#$%^&*(),.?":{}|<>]/,
        "La contraseña debe contener al menos un carácter especial",
      ),

    confirmPassword: z.string().min(1, "Confirma tu contraseña"),

    name: z
      .string()
      .min(1, "El nombre es requerido")
      .min(2, "El nombre debe tener al menos 2 caracteres")
      .max(100, "El nombre debe tener máximo 100 caracteres"),

    acceptTerms: z
      .boolean()
      .refine(
        (val) => val === true,
        "Debes aceptar los términos y condiciones",
      ),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

/**
 * Tipo inferido del schema de registro
 * Usado en React Hook Form
 */
export type RegisterFormData = z.infer<typeof registerSchema>;

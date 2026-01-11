import { z } from "zod";

/**
 * Schema de validación para el formulario de offerings
 *
 * Reglas de validación según requirements 3.1-3.7:
 * - Nombre: 3-100 caracteres
 * - Duración: 15-480 minutos
 * - Capacidad por slot: 1-100
 * - Capacidad diaria: opcional, mínimo 1
 */
export const offeringFormSchema = z.object({
  name: z
    .string()
    .min(3, "El nombre debe tener al menos 3 caracteres")
    .max(100, "El nombre no puede exceder 100 caracteres")
    .trim(),

  durationMinutes: z
    .number({
      error: "La duración debe ser un número",
    })
    .int("La duración debe ser un número entero")
    .min(15, "La duración mínima es 15 minutos")
    .max(480, "La duración máxima es 480 minutos (8 horas)"),

  maxCapacityPerSlot: z
    .number({
      error: "La capacidad debe ser un número",
    })
    .int("La capacidad debe ser un número entero")
    .min(1, "La capacidad mínima es 1")
    .max(100, "La capacidad máxima es 100"),

  maxDailyCapacity: z
    .number({
      error: "La capacidad diaria debe ser un número",
    })
    .int("La capacidad diaria debe ser un número entero")
    .min(1, "La capacidad diaria mínima es 1")
    .nullable()
    .optional(),
});

/**
 * Tipo inferido del schema de validación
 */
export type OfferingFormData = z.infer<typeof offeringFormSchema>;

/**
 * Valores por defecto del formulario
 */
export const defaultOfferingValues: OfferingFormData = {
  name: "",
  durationMinutes: 30,
  maxCapacityPerSlot: 1,
  maxDailyCapacity: null,
};

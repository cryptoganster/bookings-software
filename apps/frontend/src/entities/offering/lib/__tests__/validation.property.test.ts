import { describe, it, expect } from "vitest";
import { fc } from "@fast-check/vitest";
import { offeringFormSchema } from "../validation";

/**
 * Property-Based Tests para validación de formulario de offerings
 *
 * Feature: offering-frontend-integration
 * Property 6: Validación previene envío inválido
 * Validates: Requirements 3.8
 */
describe("Offering Form Validation - Property Tests", () => {
  describe("Property 6: Validación previene envío inválido", () => {
    it("should reject names shorter than 3 characters", () => {
      fc.assert(
        fc.property(
          // Generar strings de 0-2 caracteres
          fc.string({ maxLength: 2 }),
          fc.integer({ min: 15, max: 480 }),
          fc.integer({ min: 1, max: 100 }),
          fc.option(fc.integer({ min: 1 }), { nil: null }),
          (name, duration, capacity, dailyCapacity) => {
            const result = offeringFormSchema.safeParse({
              name,
              durationMinutes: duration,
              maxCapacityPerSlot: capacity,
              maxDailyCapacity: dailyCapacity,
            });

            // Debe fallar la validación
            expect(result.success).toBe(false);

            if (!result.success) {
              // Debe contener error de nombre
              const nameError = result.error.issues.find(
                (issue) => issue.path[0] === "name",
              );
              expect(nameError).toBeDefined();
              expect(nameError?.message).toContain("al menos 3 caracteres");
            }
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should reject names longer than 100 characters", () => {
      fc.assert(
        fc.property(
          // Generar strings de 101+ caracteres
          fc.string({ minLength: 101, maxLength: 200 }),
          fc.integer({ min: 15, max: 480 }),
          fc.integer({ min: 1, max: 100 }),
          fc.option(fc.integer({ min: 1 }), { nil: null }),
          (name, duration, capacity, dailyCapacity) => {
            const result = offeringFormSchema.safeParse({
              name,
              durationMinutes: duration,
              maxCapacityPerSlot: capacity,
              maxDailyCapacity: dailyCapacity,
            });

            // Debe fallar la validación
            expect(result.success).toBe(false);

            if (!result.success) {
              // Debe contener error de nombre
              const nameError = result.error.issues.find(
                (issue) => issue.path[0] === "name",
              );
              expect(nameError).toBeDefined();
              expect(nameError?.message).toContain(
                "no puede exceder 100 caracteres",
              );
            }
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should reject durations less than 15 minutes", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 3, maxLength: 100 }),
          // Generar duraciones inválidas (< 15)
          fc.integer({ min: -100, max: 14 }),
          fc.integer({ min: 1, max: 100 }),
          fc.option(fc.integer({ min: 1 }), { nil: null }),
          (name, duration, capacity, dailyCapacity) => {
            const result = offeringFormSchema.safeParse({
              name,
              durationMinutes: duration,
              maxCapacityPerSlot: capacity,
              maxDailyCapacity: dailyCapacity,
            });

            // Debe fallar la validación
            expect(result.success).toBe(false);

            if (!result.success) {
              // Debe contener error de duración
              const durationError = result.error.issues.find(
                (issue) => issue.path[0] === "durationMinutes",
              );
              expect(durationError).toBeDefined();
              expect(durationError?.message).toContain("mínima es 15 minutos");
            }
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should reject durations greater than 480 minutes", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 3, maxLength: 100 }),
          // Generar duraciones inválidas (> 480)
          fc.integer({ min: 481, max: 1000 }),
          fc.integer({ min: 1, max: 100 }),
          fc.option(fc.integer({ min: 1 }), { nil: null }),
          (name, duration, capacity, dailyCapacity) => {
            const result = offeringFormSchema.safeParse({
              name,
              durationMinutes: duration,
              maxCapacityPerSlot: capacity,
              maxDailyCapacity: dailyCapacity,
            });

            // Debe fallar la validación
            expect(result.success).toBe(false);

            if (!result.success) {
              // Debe contener error de duración
              const durationError = result.error.issues.find(
                (issue) => issue.path[0] === "durationMinutes",
              );
              expect(durationError).toBeDefined();
              expect(durationError?.message).toContain("máxima es 480 minutos");
            }
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should reject capacity per slot less than 1", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 3, maxLength: 100 }),
          fc.integer({ min: 15, max: 480 }),
          // Generar capacidades inválidas (< 1)
          fc.integer({ min: -100, max: 0 }),
          fc.option(fc.integer({ min: 1 }), { nil: null }),
          (name, duration, capacity, dailyCapacity) => {
            const result = offeringFormSchema.safeParse({
              name,
              durationMinutes: duration,
              maxCapacityPerSlot: capacity,
              maxDailyCapacity: dailyCapacity,
            });

            // Debe fallar la validación
            expect(result.success).toBe(false);

            if (!result.success) {
              // Debe contener error de capacidad
              const capacityError = result.error.issues.find(
                (issue) => issue.path[0] === "maxCapacityPerSlot",
              );
              expect(capacityError).toBeDefined();
              expect(capacityError?.message).toContain("mínima es 1");
            }
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should reject capacity per slot greater than 100", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 3, maxLength: 100 }),
          fc.integer({ min: 15, max: 480 }),
          // Generar capacidades inválidas (> 100)
          fc.integer({ min: 101, max: 500 }),
          fc.option(fc.integer({ min: 1 }), { nil: null }),
          (name, duration, capacity, dailyCapacity) => {
            const result = offeringFormSchema.safeParse({
              name,
              durationMinutes: duration,
              maxCapacityPerSlot: capacity,
              maxDailyCapacity: dailyCapacity,
            });

            // Debe fallar la validación
            expect(result.success).toBe(false);

            if (!result.success) {
              // Debe contener error de capacidad
              const capacityError = result.error.issues.find(
                (issue) => issue.path[0] === "maxCapacityPerSlot",
              );
              expect(capacityError).toBeDefined();
              expect(capacityError?.message).toContain("máxima es 100");
            }
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should reject daily capacity less than 1 when provided", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 3, maxLength: 100 }),
          fc.integer({ min: 15, max: 480 }),
          fc.integer({ min: 1, max: 100 }),
          // Generar capacidades diarias inválidas (< 1)
          fc.integer({ min: -100, max: 0 }),
          (name, duration, capacity, dailyCapacity) => {
            const result = offeringFormSchema.safeParse({
              name,
              durationMinutes: duration,
              maxCapacityPerSlot: capacity,
              maxDailyCapacity: dailyCapacity,
            });

            // Debe fallar la validación
            expect(result.success).toBe(false);

            if (!result.success) {
              // Debe contener error de capacidad diaria
              const dailyCapacityError = result.error.issues.find(
                (issue) => issue.path[0] === "maxDailyCapacity",
              );
              expect(dailyCapacityError).toBeDefined();
              expect(dailyCapacityError?.message).toContain(
                "diaria mínima es 1",
              );
            }
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should reject non-integer durations", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 3, maxLength: 100 }),
          // Generar números decimales
          fc.double({ min: 15.1, max: 479.9, noNaN: true }),
          fc.integer({ min: 1, max: 100 }),
          fc.option(fc.integer({ min: 1 }), { nil: null }),
          (name, duration, capacity, dailyCapacity) => {
            const result = offeringFormSchema.safeParse({
              name,
              durationMinutes: duration,
              maxCapacityPerSlot: capacity,
              maxDailyCapacity: dailyCapacity,
            });

            // Debe fallar la validación
            expect(result.success).toBe(false);

            if (!result.success) {
              // Debe contener error de tipo entero
              const durationError = result.error.issues.find(
                (issue) => issue.path[0] === "durationMinutes",
              );
              expect(durationError).toBeDefined();
              expect(durationError?.message).toContain("número entero");
            }
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should accept valid offering data", () => {
      fc.assert(
        fc.property(
          // Generar datos válidos
          fc.string({ minLength: 3, maxLength: 100 }),
          fc.integer({ min: 15, max: 480 }),
          fc.integer({ min: 1, max: 100 }),
          fc.option(fc.integer({ min: 1 }), { nil: null }),
          (name, duration, capacity, dailyCapacity) => {
            const result = offeringFormSchema.safeParse({
              name,
              durationMinutes: duration,
              maxCapacityPerSlot: capacity,
              maxDailyCapacity: dailyCapacity,
            });

            // Debe pasar la validación
            expect(result.success).toBe(true);

            if (result.success) {
              // Los datos deben coincidir (con trim en nombre)
              expect(result.data.name).toBe(name.trim());
              expect(result.data.durationMinutes).toBe(duration);
              expect(result.data.maxCapacityPerSlot).toBe(capacity);
              expect(result.data.maxDailyCapacity).toBe(dailyCapacity);
            }
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should trim whitespace from names", () => {
      fc.assert(
        fc.property(
          // Generar nombres con espacios al inicio/final
          fc.string({ minLength: 3, maxLength: 100 }),
          fc.nat({ max: 5 }), // Espacios al inicio
          fc.nat({ max: 5 }), // Espacios al final
          fc.integer({ min: 15, max: 480 }),
          fc.integer({ min: 1, max: 100 }),
          (name, startSpaces, endSpaces, duration, capacity) => {
            const paddedName =
              " ".repeat(startSpaces) + name + " ".repeat(endSpaces);

            const result = offeringFormSchema.safeParse({
              name: paddedName,
              durationMinutes: duration,
              maxCapacityPerSlot: capacity,
              maxDailyCapacity: null,
            });

            if (result.success) {
              // El nombre debe estar trimmed
              expect(result.data.name).toBe(name.trim());
              expect(result.data.name).not.toContain("  ");
            }
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});

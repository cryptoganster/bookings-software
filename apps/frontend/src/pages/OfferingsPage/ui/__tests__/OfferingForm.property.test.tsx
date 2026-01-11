/**
 * Property-based tests for OfferingForm component
 *
 * Feature: offering-frontend-integration
 * Property 4: Edición precarga datos correctamente
 * Validates: Requirements 2.2
 *
 * Tests that for any valid offering, when the edit modal opens,
 * all form fields contain exactly the current values of the offering.
 */

import { describe, it, expect, vi } from "vitest";
import { fc } from "@fast-check/vitest";
import { render, screen } from "@/test/test-utils";
import { OfferingForm } from "../OfferingForm";
import type { OfferingDto } from "@packages/shared-types";

describe("OfferingForm - Property Tests", () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  describe("Property 4: Edición precarga datos correctamente", () => {
    it("precarga todos los campos correctamente para cualquier offering válido", () => {
      // Generador de offerings válidos
      const offeringArb = fc.record({
        id: fc.uuid(),
        businessId: fc.uuid(),
        name: fc.string({ minLength: 3, maxLength: 100 }),
        duration: fc.integer({ min: 15, max: 480 }),
        maxCapacityPerSlot: fc.integer({ min: 1, max: 100 }),
        maxDailyCapacity: fc.option(fc.integer({ min: 1 }), { nil: null }),
        isActive: fc.boolean(),
        createdAt: fc.constant(new Date().toISOString()),
      });

      fc.assert(
        fc.property(offeringArb, (offering: OfferingDto) => {
          // Renderizar formulario con offering
          const { unmount } = render(
            <OfferingForm
              offering={offering}
              onSubmit={mockOnSubmit}
              onCancel={mockOnCancel}
            />,
          );

          // Verificar que el campo nombre tiene el valor correcto
          const nameInput = screen.getByLabelText(
            /nombre del servicio/i,
          ) as HTMLInputElement;
          expect(nameInput.value).toBe(offering.name);

          // Verificar que el campo duración tiene el valor correcto
          const durationInput = screen.getByLabelText(
            /duración \(minutos\)/i,
          ) as HTMLInputElement;
          expect(durationInput.value).toBe(offering.duration.toString());

          // Verificar que el campo capacidad por slot tiene el valor correcto
          const capacityInput = screen.getByLabelText(
            /capacidad por slot/i,
          ) as HTMLInputElement;
          expect(capacityInput.value).toBe(
            offering.maxCapacityPerSlot.toString(),
          );

          // Verificar que el campo capacidad diaria tiene el valor correcto
          const dailyCapacityInput = screen.getByLabelText(
            /capacidad diaria máxima/i,
          ) as HTMLInputElement;
          if (offering.maxDailyCapacity !== null) {
            expect(dailyCapacityInput.value).toBe(
              offering.maxDailyCapacity.toString(),
            );
          } else {
            // Si es null, el campo debe estar vacío
            expect(dailyCapacityInput.value).toBe("");
          }

          // Limpiar después de cada iteración
          unmount();
        }),
        { numRuns: 100 }, // Ejecutar 100 iteraciones
      );
    });
  });
});

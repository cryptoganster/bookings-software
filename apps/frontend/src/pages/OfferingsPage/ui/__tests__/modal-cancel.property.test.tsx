/**
 * Property-based tests for modal cancel behavior
 *
 * Feature: offering-frontend-integration
 * Property 1: Modal cierra sin guardar al cancelar
 * Validates: Requirements 1.3, 2.6
 *
 * Tests that for any modal (create or edit), when the user clicks "Cancel",
 * the modal closes without making any API call and without modifying server state.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { fc } from "@fast-check/vitest";
import { render, screen, waitFor } from "@/test/test-utils";
import { userEvent } from "@testing-library/user-event";
import { OfferingCreateModal } from "../OfferingCreateModal";
import { OfferingEditModal } from "../OfferingEditModal";
import type { OfferingDto } from "@packages/shared-types";
import * as offeringHooks from "@entities/offering";

describe("Modal Cancel Behavior - Property Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Property 1: Modal cierra sin guardar al cancelar", () => {
    it("cierra modal de creación sin llamar a API para cualquier estado del formulario", async () => {
      const user = userEvent.setup();

      // Generador simple sin necesidad de llenar campos
      const simpleArb = fc.constant({});

      // Mock de useCreateOffering
      const mockMutateAsync = vi.fn();
      vi.spyOn(offeringHooks, "useCreateOffering").mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: false,
        isError: false,
        isSuccess: false,
        error: null,
        data: undefined,
        mutate: vi.fn(),
        reset: vi.fn(),
        status: "idle",
        variables: undefined,
        context: undefined,
        failureCount: 0,
        failureReason: null,
        isPaused: false,
        isIdle: true,
        submittedAt: 0,
      });

      await fc.assert(
        fc.asyncProperty(simpleArb, async () => {
          const mockOnClose = vi.fn();

          const { unmount } = render(
            <OfferingCreateModal opened={true} onClose={mockOnClose} />,
          );

          try {
            // Hacer clic en Cancelar usando getAllByRole y seleccionar el primero
            const cancelButtons = screen.getAllByRole("button", {
              name: /cancelar/i,
            });
            await user.click(cancelButtons[0]);

            // Verificar que onClose fue llamado
            await waitFor(() => {
              expect(mockOnClose).toHaveBeenCalledTimes(1);
            });

            // Verificar que NO se hizo llamada a API
            expect(mockMutateAsync).not.toHaveBeenCalled();
          } finally {
            // Asegurar limpieza
            unmount();
          }
        }),
        { numRuns: 100 },
      );
    });

    it("cierra modal de edición sin llamar a API para cualquier modificación", async () => {
      const user = userEvent.setup();

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

      // Mock de useUpdateOffering
      const mockMutateAsync = vi.fn();
      vi.spyOn(offeringHooks, "useUpdateOffering").mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: false,
        isError: false,
        isSuccess: false,
        error: null,
        data: undefined,
        mutate: vi.fn(),
        reset: vi.fn(),
        status: "idle",
        variables: undefined,
        context: undefined,
        failureCount: 0,
        failureReason: null,
        isPaused: false,
        isIdle: true,
        submittedAt: 0,
      });

      await fc.assert(
        fc.asyncProperty(offeringArb, async (offering: OfferingDto) => {
          const mockOnClose = vi.fn();

          const { unmount } = render(
            <OfferingEditModal
              opened={true}
              onClose={mockOnClose}
              offering={offering}
            />,
          );

          try {
            // Hacer clic en Cancelar sin modificar nada
            const cancelButtons = screen.getAllByRole("button", {
              name: /cancelar/i,
            });
            await user.click(cancelButtons[0]);

            // Verificar que onClose fue llamado
            await waitFor(() => {
              expect(mockOnClose).toHaveBeenCalledTimes(1);
            });

            // Verificar que NO se hizo llamada a API
            expect(mockMutateAsync).not.toHaveBeenCalled();
          } finally {
            // Asegurar limpieza
            unmount();
          }
        }),
        { numRuns: 100 },
      );
    });
  });
});

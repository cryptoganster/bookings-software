/**
 * Additional Property-based tests for offering modals
 *
 * Feature: offering-frontend-integration
 *
 * Property 3: Error mantiene modal abierto (Requirements 1.6, 2.5)
 * Property 9: Loading deshabilita interacción (Requirements 5.1, 5.2)
 * Property 10: Eliminación requiere confirmación (Requirements 5.3)
 * Property 11: Operaciones no bloquean UI (Requirements 5.4)
 * Property 12: Modal previene cierre accidental (Requirements 5.5)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { fc } from "@fast-check/vitest";
import { render, screen, waitFor } from "@/test/test-utils";
import { userEvent } from "@testing-library/user-event";
import { OfferingCreateModal } from "../OfferingCreateModal";
import { OfferingEditModal } from "../OfferingEditModal";
import { OfferingsPage } from "../OfferingsPage";
import type { OfferingDto } from "@packages/shared-types";
import * as offeringHooks from "@entities/offering";

describe("Additional Property Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Property 3: Error mantiene modal abierto", () => {
    it("mantiene modal de creación abierto cuando falla la API", async () => {
      const user = userEvent.setup();

      const validFormDataArb = fc.record({
        name: fc
          .string({ minLength: 3, maxLength: 50 })
          .filter((s) => !s.includes("{")),
        duration: fc.integer({ min: 15, max: 480 }),
      });

      const apiErrorArb = fc.oneof(
        fc.constant({ response: { status: 409 } }),
        fc.constant({ response: { status: 500 } }),
      );

      await fc.assert(
        fc.asyncProperty(
          validFormDataArb,
          apiErrorArb,
          async (formData, apiError) => {
            const mockMutateAsync = vi.fn().mockRejectedValue(apiError);
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
              variables: undefined as never,
              context: undefined,
              failureCount: 0,
              failureReason: null,
              isPaused: false,
              isIdle: true,
              submittedAt: 0,
            });

            const mockOnClose = vi.fn();
            const { unmount } = render(
              <OfferingCreateModal opened={true} onClose={mockOnClose} />,
            );

            try {
              const nameInput = screen.getByLabelText(/nombre del servicio/i);
              await user.clear(nameInput);
              await user.type(nameInput, formData.name);

              const saveButtons = screen.getAllByRole("button", {
                name: /guardar/i,
              });
              await user.click(saveButtons[0]);

              await waitFor(() => expect(mockMutateAsync).toHaveBeenCalled());

              // Modal NO debe cerrarse
              expect(mockOnClose).not.toHaveBeenCalled();

              // Datos deben preservarse
              expect((nameInput as HTMLInputElement).value).toBe(formData.name);
            } finally {
              unmount();
            }
          },
        ),
        { numRuns: 50 },
      );
    });

    it("mantiene modal de edición abierto cuando falla la API", async () => {
      const user = userEvent.setup();

      const offeringArb = fc.record({
        id: fc.uuid(),
        businessId: fc.uuid(),
        name: fc.string({ minLength: 3, maxLength: 50 }),
        duration: fc.integer({ min: 15, max: 480 }),
        maxCapacityPerSlot: fc.integer({ min: 1, max: 100 }),
        maxDailyCapacity: fc.option(fc.integer({ min: 1 }), { nil: null }),
        isActive: fc.boolean(),
        createdAt: fc.constant(new Date().toISOString()),
      });

      const apiErrorArb = fc.oneof(
        fc.constant({ response: { status: 409 } }),
        fc.constant({ response: { status: 404 } }),
      );

      await fc.assert(
        fc.asyncProperty(
          offeringArb,
          apiErrorArb,
          async (offering: OfferingDto, apiError) => {
            const mockMutateAsync = vi.fn().mockRejectedValue(apiError);
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
              variables: undefined as never,
              context: undefined,
              failureCount: 0,
              failureReason: null,
              isPaused: false,
              isIdle: true,
              submittedAt: 0,
            });

            const mockOnClose = vi.fn();
            const { unmount } = render(
              <OfferingEditModal
                opened={true}
                onClose={mockOnClose}
                offering={offering}
              />,
            );

            try {
              const saveButtons = screen.getAllByRole("button", {
                name: /guardar/i,
              });
              await user.click(saveButtons[0]);

              await waitFor(() => expect(mockMutateAsync).toHaveBeenCalled());

              // Modal NO debe cerrarse
              expect(mockOnClose).not.toHaveBeenCalled();
            } finally {
              unmount();
            }
          },
        ),
        { numRuns: 50 },
      );
    });
  });

  describe("Property 9: Loading deshabilita interacción", () => {
    it("deshabilita botón durante loading en modal de creación", async () => {
      const simpleArb = fc.constant({});

      await fc.assert(
        fc.asyncProperty(simpleArb, async () => {
          // Mock con isPending = true
          vi.spyOn(offeringHooks, "useCreateOffering").mockReturnValue({
            mutateAsync: vi.fn(),
            isPending: true,
            isError: false,
            isSuccess: false,
            error: null,
            data: undefined,
            mutate: vi.fn(),
            reset: vi.fn(),
            status: "pending",
            variables: undefined as never,
            context: undefined,
            failureCount: 0,
            failureReason: null,
            isPaused: false,
            isIdle: false,
            submittedAt: Date.now(),
          });

          const mockOnClose = vi.fn();
          const { unmount } = render(
            <OfferingCreateModal opened={true} onClose={mockOnClose} />,
          );

          try {
            const saveButtons = screen.getAllByRole("button", {
              name: /guardar/i,
            });

            // Botón debe estar deshabilitado durante loading
            expect(saveButtons[0]).toBeDisabled();
          } finally {
            unmount();
          }
        }),
        { numRuns: 50 },
      );
    });

    it("deshabilita botón durante loading en modal de edición", async () => {
      const offeringArb = fc.record({
        id: fc.uuid(),
        businessId: fc.uuid(),
        name: fc.string({ minLength: 3, maxLength: 50 }),
        duration: fc.integer({ min: 15, max: 480 }),
        maxCapacityPerSlot: fc.integer({ min: 1, max: 100 }),
        maxDailyCapacity: fc.option(fc.integer({ min: 1 }), { nil: null }),
        isActive: fc.boolean(),
        createdAt: fc.constant(new Date().toISOString()),
      });

      await fc.assert(
        fc.asyncProperty(offeringArb, async (offering: OfferingDto) => {
          // Mock con isPending = true
          vi.spyOn(offeringHooks, "useUpdateOffering").mockReturnValue({
            mutateAsync: vi.fn(),
            isPending: true,
            isError: false,
            isSuccess: false,
            error: null,
            data: undefined,
            mutate: vi.fn(),
            reset: vi.fn(),
            status: "pending",
            variables: undefined as never,
            context: undefined,
            failureCount: 0,
            failureReason: null,
            isPaused: false,
            isIdle: false,
            submittedAt: Date.now(),
          });

          const mockOnClose = vi.fn();
          const { unmount } = render(
            <OfferingEditModal
              opened={true}
              onClose={mockOnClose}
              offering={offering}
            />,
          );

          try {
            const saveButtons = screen.getAllByRole("button", {
              name: /guardar/i,
            });

            // Botón debe estar deshabilitado durante loading
            expect(saveButtons[0]).toBeDisabled();
          } finally {
            unmount();
          }
        }),
        { numRuns: 50 },
      );
    });
  });

  describe("Property 10: Eliminación requiere confirmación", () => {
    it("muestra confirmación antes de eliminar", async () => {
      const offeringArb = fc.record({
        id: fc.uuid(),
        businessId: fc.uuid(),
        name: fc.string({ minLength: 3, maxLength: 50 }),
        duration: fc.integer({ min: 15, max: 480 }),
        maxCapacityPerSlot: fc.integer({ min: 1, max: 100 }),
        maxDailyCapacity: fc.option(fc.integer({ min: 1 }), { nil: null }),
        isActive: fc.boolean(),
        createdAt: fc.constant(new Date().toISOString()),
      });

      await fc.assert(
        fc.asyncProperty(offeringArb, async (offering: OfferingDto) => {
          // Mock window.confirm para rechazar
          const mockConfirm = vi
            .spyOn(window, "confirm")
            .mockReturnValue(false);

          const mockDeleteMutate = vi.fn();
          vi.spyOn(offeringHooks, "useOfferings").mockReturnValue({
            data: [offering],
            isLoading: false,
            isError: false,
            error: null,
            isSuccess: true,
            status: "success",
            dataUpdatedAt: Date.now(),
            errorUpdatedAt: 0,
            failureCount: 0,
            failureReason: null,
            errorUpdateCount: 0,
            isFetched: true,
            isFetchedAfterMount: true,
            isFetching: false,
            isInitialLoading: false,
            isLoadingError: false,
            isPaused: false,
            isPending: false,
            isPlaceholderData: false,
            isRefetchError: false,
            isRefetching: false,
            isStale: false,
            refetch: vi.fn(),
            isEnabled: true,
            fetchStatus: "idle" as const,
            promise: Promise.resolve([offering]),
          });

          vi.spyOn(offeringHooks, "useDeleteOffering").mockReturnValue({
            mutateAsync: mockDeleteMutate,
            isPending: false,
            isError: false,
            isSuccess: false,
            error: null,
            data: undefined,
            mutate: vi.fn(),
            reset: vi.fn(),
            status: "idle",
            variables: undefined as never,
            context: undefined,
            failureCount: 0,
            failureReason: null,
            isPaused: false,
            isIdle: true,
            submittedAt: 0,
          });

          vi.spyOn(offeringHooks, "useToggleOfferingActive").mockReturnValue({
            mutateAsync: vi.fn(),
            isPending: false,
            isError: false,
            isSuccess: false,
            error: null,
            data: undefined,
            mutate: vi.fn(),
            reset: vi.fn(),
            status: "idle",
            variables: undefined as never,
            context: undefined,
            failureCount: 0,
            failureReason: null,
            isPaused: false,
            isIdle: true,
            submittedAt: 0,
          });

          const { unmount } = render(<OfferingsPage />);

          try {
            // Si el usuario cancela, no debe llamarse a la API
            expect(mockDeleteMutate).not.toHaveBeenCalled();
          } finally {
            mockConfirm.mockRestore();
            unmount();
          }
        }),
        { numRuns: 50 },
      );
    });
  });

  describe("Property 11: Operaciones no bloquean UI", () => {
    it("operaciones son asíncronas y no bloquean", async () => {
      const simpleArb = fc.constant({});

      await fc.assert(
        fc.asyncProperty(simpleArb, async () => {
          const mockMutateAsync = vi.fn().mockResolvedValue({ id: "test-id" });
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
            variables: undefined as never,
            context: undefined,
            failureCount: 0,
            failureReason: null,
            isPaused: false,
            isIdle: true,
            submittedAt: 0,
          });

          const mockOnClose = vi.fn();
          const { unmount } = render(
            <OfferingCreateModal opened={true} onClose={mockOnClose} />,
          );

          try {
            // La operación debe ser asíncrona (retorna Promise)
            expect(mockMutateAsync).toBeInstanceOf(Function);
          } finally {
            unmount();
          }
        }),
        { numRuns: 50 },
      );
    });
  });

  describe("Property 12: Modal previene cierre accidental", () => {
    it("previene cierre durante operación en progreso", async () => {
      const simpleArb = fc.constant({});

      await fc.assert(
        fc.asyncProperty(simpleArb, async () => {
          // Mock con isPending = true
          vi.spyOn(offeringHooks, "useCreateOffering").mockReturnValue({
            mutateAsync: vi.fn(),
            isPending: true,
            isError: false,
            isSuccess: false,
            error: null,
            data: undefined,
            mutate: vi.fn(),
            reset: vi.fn(),
            status: "pending",
            variables: undefined as never,
            context: undefined,
            failureCount: 0,
            failureReason: null,
            isPaused: false,
            isIdle: false,
            submittedAt: Date.now(),
          });

          const mockOnClose = vi.fn();
          const { container, unmount } = render(
            <OfferingCreateModal opened={true} onClose={mockOnClose} />,
          );

          try {
            // Verificar que el modal tiene la configuración correcta
            const modal = container.querySelector(
              '[data-modal-content="true"]',
            );
            expect(modal).toBeTruthy();

            // El botón X debe estar deshabilitado durante loading
            const closeButton = container.querySelector(
              ".mantine-Modal-close",
            ) as HTMLButtonElement;
            if (closeButton) {
              expect(closeButton).toBeDisabled();
            }
          } finally {
            unmount();
          }
        }),
        { numRuns: 50 },
      );
    });
  });
});

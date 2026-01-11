/**
 * Property-based tests for OfferingEditModal component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fc } from "@fast-check/vitest";
import { render, screen, waitFor, cleanup } from "@/test/test-utils";
import { OfferingEditModal } from "../OfferingEditModal";
import * as offeringHooks from "@entities/offering";
import { notifications } from "@mantine/notifications";
import type { OfferingDto } from "@packages/shared-types";
import userEvent from "@testing-library/user-event";

vi.mock("@entities/offering", async () => {
  const actual = await vi.importActual("@entities/offering");
  return { ...actual, useUpdateOffering: vi.fn() };
});

vi.mock("@mantine/notifications", () => ({
  notifications: { show: vi.fn() },
  Notifications: () => null,
}));

describe("OfferingEditModal - Property Tests", () => {
  const mockOnClose = vi.fn();
  let mockMutateAsync: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockMutateAsync = vi.fn();
    vi.clearAllMocks();

    vi.mocked(offeringHooks.useUpdateOffering).mockReturnValue({
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
      isIdle: true,
      isPaused: false,
      submittedAt: 0,
    } as ReturnType<typeof offeringHooks.useUpdateOffering>);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  describe("Property 5: Actualización exitosa refleja cambios", () => {
    it("actualiza el offering con modificación de nombre", async () => {
      const validNameArb = fc
        .stringMatching(/^[a-zA-Z0-9][a-zA-Z0-9 ]{1,98}[a-zA-Z0-9]$/)
        .filter((s) => s.trim().length >= 3);

      const originalOfferingArb = fc.record({
        id: fc.uuid(),
        businessId: fc.uuid(),
        name: validNameArb,
        duration: fc.integer({ min: 15, max: 480 }),
        maxCapacityPerSlot: fc.integer({ min: 1, max: 100 }),
        maxDailyCapacity: fc.option(fc.integer({ min: 1 }), { nil: null }),
        isActive: fc.boolean(),
        createdAt: fc.constant(new Date().toISOString()),
      });

      const newNameArb = validNameArb;

      await fc.assert(
        fc.asyncProperty(
          originalOfferingArb,
          newNameArb,
          async (originalOffering: OfferingDto, newName: string) => {
            mockMutateAsync.mockClear();
            mockOnClose.mockClear();
            vi.mocked(notifications.show).mockClear();

            const user = userEvent.setup();
            const updatedOffering: OfferingDto = {
              ...originalOffering,
              name: newName,
            };
            mockMutateAsync.mockResolvedValueOnce(updatedOffering);

            const { unmount } = render(
              <OfferingEditModal
                opened={true}
                onClose={mockOnClose}
                offering={originalOffering}
              />,
            );

            await waitFor(
              () => {
                const nameInput = screen.getByLabelText(/nombre del servicio/i);
                expect(nameInput).toBeInTheDocument();
                expect(nameInput).toHaveValue(originalOffering.name);
              },
              { timeout: 3000 },
            );

            const nameInput = screen.getByLabelText(/nombre del servicio/i);
            await user.clear(nameInput);
            await user.type(nameInput, newName);

            const submitButtons = screen.getAllByRole("button", {
              name: /guardar/i,
            });
            await user.click(submitButtons[0]);

            await waitFor(
              () => {
                expect(mockMutateAsync).toHaveBeenCalledTimes(1);
              },
              { timeout: 3000 },
            );

            expect(mockMutateAsync).toHaveBeenCalledWith({
              id: originalOffering.id,
              dto: {
                name: newName,
                duration: originalOffering.duration,
                maxCapacityPerSlot: originalOffering.maxCapacityPerSlot,
                maxDailyCapacity:
                  originalOffering.maxDailyCapacity ?? undefined,
              },
            });

            await waitFor(
              () => {
                expect(notifications.show).toHaveBeenCalledWith(
                  expect.objectContaining({
                    message: "Servicio actualizado exitosamente",
                    color: "green",
                  }),
                );
              },
              { timeout: 3000 },
            );

            await waitFor(
              () => {
                expect(mockOnClose).toHaveBeenCalledTimes(1);
              },
              { timeout: 3000 },
            );

            unmount();
            cleanup();
            await new Promise((resolve) => setTimeout(resolve, 10));
          },
        ),
        { numRuns: 5, endOnFailure: true },
      );
    });

    it("preserva valores no modificados durante la actualización", async () => {
      const validNameArb = fc
        .stringMatching(/^[a-zA-Z0-9][a-zA-Z0-9 ]{1,98}[a-zA-Z0-9]$/)
        .filter((s) => s.trim().length >= 3);

      const offeringArb = fc.record({
        id: fc.uuid(),
        businessId: fc.uuid(),
        name: validNameArb,
        duration: fc.integer({ min: 15, max: 480 }),
        maxCapacityPerSlot: fc.integer({ min: 1, max: 100 }),
        maxDailyCapacity: fc.option(fc.integer({ min: 1 }), { nil: null }),
        isActive: fc.boolean(),
        createdAt: fc.constant(new Date().toISOString()),
      });

      await fc.assert(
        fc.asyncProperty(offeringArb, async (offering: OfferingDto) => {
          mockMutateAsync.mockClear();
          mockOnClose.mockClear();

          const user = userEvent.setup();
          mockMutateAsync.mockResolvedValueOnce(offering);

          const { unmount } = render(
            <OfferingEditModal
              opened={true}
              onClose={mockOnClose}
              offering={offering}
            />,
          );

          await waitFor(
            () => {
              const nameInput = screen.getByLabelText(/nombre del servicio/i);
              expect(nameInput).toBeInTheDocument();
              expect(nameInput).toHaveValue(offering.name);
            },
            { timeout: 3000 },
          );

          const submitButtons = screen.getAllByRole("button", {
            name: /guardar/i,
          });
          await user.click(submitButtons[0]);

          await waitFor(
            () => {
              expect(mockMutateAsync).toHaveBeenCalledTimes(1);
            },
            { timeout: 3000 },
          );

          const callArgs = mockMutateAsync.mock.calls[0][0];
          expect(callArgs).toEqual({
            id: offering.id,
            dto: {
              name: offering.name,
              duration: offering.duration,
              maxCapacityPerSlot: offering.maxCapacityPerSlot,
              maxDailyCapacity: offering.maxDailyCapacity ?? undefined,
            },
          });

          unmount();
          cleanup();
          await new Promise((resolve) => setTimeout(resolve, 10));
        }),
        { numRuns: 5, endOnFailure: true },
      );
    });
  });
});

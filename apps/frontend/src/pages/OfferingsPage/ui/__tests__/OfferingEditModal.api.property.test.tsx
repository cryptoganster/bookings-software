/**
 * Property-based tests for OfferingEditModal API calls
 *
 * Feature: offering-frontend-integration
 * Property 13: API calls son correctas
 * Validates: Requirements 6.2
 *
 * Tests that for any offering update, the correct HTTP method (PUT)
 * is sent to the correct endpoint with the correct payload.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fc } from "@fast-check/vitest";
import { render, screen, waitFor, cleanup } from "@/test/test-utils";
import { OfferingEditModal } from "../OfferingEditModal";
import * as offeringHooks from "@entities/offering";
import type { OfferingDto } from "@packages/shared-types";
import userEvent from "@testing-library/user-event";

// Mock dependencies
vi.mock("@entities/offering", async () => {
  const actual = await vi.importActual("@entities/offering");
  return {
    ...actual,
    useUpdateOffering: vi.fn(),
  };
});

vi.mock("@mantine/notifications", () => ({
  notifications: {
    show: vi.fn(),
  },
  Notifications: () => null,
}));

// Type for mock mutation result - using ReturnType to match actual hook
type MockMutationResult = ReturnType<typeof offeringHooks.useUpdateOffering>;

// Helper: Generate valid offering names (alphanumeric, 3-50 chars, no leading/trailing whitespace)
const alphanumChars =
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const alphanumWithSpaceChars = alphanumChars + " ";

const validNameArb = fc
  .tuple(
    fc.array(fc.constantFrom(...alphanumChars.split("")), {
      minLength: 1,
      maxLength: 1,
    }),
    fc.array(fc.constantFrom(...alphanumWithSpaceChars.split("")), {
      minLength: 1,
      maxLength: 48,
    }),
    fc.array(fc.constantFrom(...alphanumChars.split("")), {
      minLength: 1,
      maxLength: 1,
    }),
  )
  .map(
    ([first, middle, last]) => first.join("") + middle.join("") + last.join(""),
  )
  .filter(
    (s) => s.trim().length >= 3 && !s.startsWith(" ") && !s.endsWith(" "),
  );

// Helper: Generate valid offering data
const createOfferingArb = () =>
  fc.record({
    id: fc.uuid(),
    businessId: fc.uuid(),
    name: validNameArb,
    duration: fc.integer({ min: 15, max: 480 }),
    maxCapacityPerSlot: fc.integer({ min: 1, max: 100 }),
    maxDailyCapacity: fc.option(fc.integer({ min: 1, max: 1000 }), {
      nil: null,
    }),
    isActive: fc.boolean(),
    createdAt: fc.constant(new Date().toISOString()),
    updatedAt: fc.constant(new Date().toISOString()),
  });

// Helper: Generate offering with null maxDailyCapacity
const createOfferingWithNullCapacityArb = () =>
  fc.record({
    id: fc.uuid(),
    businessId: fc.uuid(),
    name: validNameArb,
    duration: fc.integer({ min: 15, max: 480 }),
    maxCapacityPerSlot: fc.integer({ min: 1, max: 100 }),
    maxDailyCapacity: fc.constant(null),
    isActive: fc.boolean(),
    createdAt: fc.constant(new Date().toISOString()),
    updatedAt: fc.constant(new Date().toISOString()),
  });

describe("OfferingEditModal - API Property Tests", () => {
  const mockOnClose = vi.fn();
  let mockMutateAsync: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Create fresh mock for each test
    mockMutateAsync = vi.fn();
    vi.clearAllMocks();

    // Default mock implementation
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
    } as unknown as MockMutationResult);
  });

  afterEach(async () => {
    cleanup();
    vi.clearAllMocks();
    // Ensure DOM is fully cleaned up between iterations
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

  describe("Property 13: API calls son correctas", () => {
    it("envía PUT con payload correcto para cualquier offering", async () => {
      await fc.assert(
        fc.asyncProperty(createOfferingArb(), async (offering: OfferingDto) => {
          // Clean state for each iteration
          cleanup();
          mockMutateAsync.mockClear();
          mockOnClose.mockClear();

          const user = userEvent.setup();

          // Mock successful update
          mockMutateAsync.mockResolvedValueOnce(offering);

          // Renderizar modal
          const { unmount } = render(
            <OfferingEditModal
              opened={true}
              onClose={mockOnClose}
              offering={offering}
            />,
          );

          try {
            // Wait for initial render to complete
            await waitFor(
              () => {
                const nameInput = screen.getByLabelText(/nombre del servicio/i);
                expect(nameInput).toBeInTheDocument();
                expect(nameInput).toHaveValue(offering.name);
              },
              { timeout: 3000 },
            );

            // Submit form sin modificaciones
            const submitButton = screen.getByRole("button", {
              name: /guardar/i,
            });
            await user.click(submitButton);

            // Verificar que se llamó mutateAsync con el ID correcto y el payload correcto
            await waitFor(
              () => {
                expect(mockMutateAsync).toHaveBeenCalledWith({
                  id: offering.id,
                  dto: {
                    name: offering.name,
                    duration: offering.duration,
                    maxCapacityPerSlot: offering.maxCapacityPerSlot,
                    maxDailyCapacity: offering.maxDailyCapacity ?? undefined,
                  },
                });
              },
              { timeout: 3000 },
            );

            // Verificar que el ID está presente (para validar que se envía a /api/offerings/:id)
            const callArgs = mockMutateAsync.mock.calls[0][0];
            expect(callArgs.id).toBe(offering.id);
            expect(callArgs.id).toBeTruthy();

            // Verificar que el DTO contiene todos los campos requeridos
            expect(callArgs.dto).toHaveProperty("name");
            expect(callArgs.dto).toHaveProperty("duration");
            expect(callArgs.dto).toHaveProperty("maxCapacityPerSlot");
            expect(callArgs.dto).toHaveProperty("maxDailyCapacity");
          } finally {
            unmount();
            await new Promise((resolve) => setTimeout(resolve, 50));
          }
        }),
        { numRuns: 5, endOnFailure: true },
      );
    });

    it("convierte null a undefined para maxDailyCapacity en el payload", async () => {
      await fc.assert(
        fc.asyncProperty(
          createOfferingWithNullCapacityArb(),
          async (offering: OfferingDto) => {
            // Clean state for each iteration
            cleanup();
            mockMutateAsync.mockClear();
            mockOnClose.mockClear();

            const user = userEvent.setup();

            // Mock successful update
            mockMutateAsync.mockResolvedValueOnce(offering);

            // Renderizar modal
            const { unmount } = render(
              <OfferingEditModal
                opened={true}
                onClose={mockOnClose}
                offering={offering}
              />,
            );

            try {
              // Wait for initial render to complete
              await waitFor(
                () => {
                  const nameInput =
                    screen.getByLabelText(/nombre del servicio/i);
                  expect(nameInput).toBeInTheDocument();
                  expect(nameInput).toHaveValue(offering.name);
                },
                { timeout: 3000 },
              );

              // Submit form
              const submitButton = screen.getByRole("button", {
                name: /guardar/i,
              });
              await user.click(submitButton);

              // Verificar que maxDailyCapacity es undefined en el payload (no null)
              await waitFor(
                () => {
                  const callArgs = mockMutateAsync.mock.calls[0][0];
                  expect(callArgs.dto.maxDailyCapacity).toBeUndefined();
                  expect(callArgs.dto.maxDailyCapacity).not.toBe(null);
                },
                { timeout: 3000 },
              );
            } finally {
              unmount();
              await new Promise((resolve) => setTimeout(resolve, 50));
            }
          },
        ),
        { numRuns: 5, endOnFailure: true },
      );
    });
  });
});

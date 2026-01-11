/**
 * Property-based tests for Cache Invalidation
 *
 * Feature: offering-frontend-integration
 * Property 14: Cache se invalida después de operaciones
 * Validates: Requirements 6.5
 *
 * Tests that for any CRUD operation (create, update, delete),
 * the TanStack Query cache is properly invalidated to ensure
 * the UI displays up-to-date data.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fc } from "@fast-check/vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import {
  useOfferings,
  useCreateOffering,
  useUpdateOffering,
  useDeleteOffering,
} from "@entities/offering";
import { offeringsService } from "@shared/api/services/offerings.service";
import type { OfferingDto } from "@packages/shared-types";

// Mock the offerings service
vi.mock("@shared/api/services/offerings.service", () => ({
  offeringsService: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

// Helper: Generate valid offering names (alphanumeric, 3-50 chars)
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

// Helper: Generate valid offering data (matching OfferingDto without updatedAt)
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
  });

// Helper: Generate create offering request
const createOfferingRequestArb = () =>
  fc.record({
    name: validNameArb,
    duration: fc.integer({ min: 15, max: 480 }),
    maxCapacityPerSlot: fc.integer({ min: 1, max: 100 }),
    maxDailyCapacity: fc.option(fc.integer({ min: 1, max: 1000 }), {
      nil: undefined,
    }),
  });

describe("Cache Invalidation - Property Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Property 14: Cache se invalida después de operaciones", () => {
    it("invalida cache después de crear offering", async () => {
      await fc.assert(
        fc.asyncProperty(
          createOfferingArb(),
          createOfferingRequestArb(),
          async (existingOffering: OfferingDto, newOfferingRequest) => {
            // Reset mocks for each iteration
            vi.clearAllMocks();

            // Create fresh QueryClient for this iteration
            const testQueryClient = new QueryClient({
              defaultOptions: {
                queries: { retry: false, gcTime: 0 },
                mutations: { retry: false },
              },
            });

            const wrapper = ({ children }: { children: ReactNode }) => (
              <QueryClientProvider client={testQueryClient}>
                {children}
              </QueryClientProvider>
            );

            // Setup initial data
            const initialOfferings = [existingOffering];
            vi.mocked(offeringsService.getAll).mockResolvedValue(
              initialOfferings,
            );

            // Create new offering response
            const newOffering: OfferingDto = {
              id: crypto.randomUUID(),
              businessId: existingOffering.businessId,
              name: newOfferingRequest.name,
              duration: newOfferingRequest.duration,
              maxCapacityPerSlot: newOfferingRequest.maxCapacityPerSlot,
              maxDailyCapacity: newOfferingRequest.maxDailyCapacity ?? null,
              isActive: true,
              createdAt: new Date().toISOString(),
            };
            vi.mocked(offeringsService.create).mockResolvedValue(newOffering);

            // First, fetch offerings to populate cache
            const { result: offeringsResult } = renderHook(
              () => useOfferings(),
              { wrapper },
            );

            await waitFor(() => {
              expect(offeringsResult.current.isSuccess).toBe(true);
            });

            // Record initial fetch count
            const initialFetchCount = vi.mocked(offeringsService.getAll).mock
              .calls.length;

            // Now create a new offering
            const { result: createResult } = renderHook(
              () => useCreateOffering(),
              { wrapper },
            );

            // Update mock to return new list after invalidation
            vi.mocked(offeringsService.getAll).mockResolvedValue([
              ...initialOfferings,
              newOffering,
            ]);

            await act(async () => {
              await createResult.current.mutateAsync(newOfferingRequest);
            });

            // Wait for cache invalidation to trigger refetch
            await waitFor(
              () => {
                return (
                  vi.mocked(offeringsService.getAll).mock.calls.length >
                  initialFetchCount
                );
              },
              { timeout: 2000 },
            );

            // Verify invalidateQueries was triggered by checking getAll was called again
            expect(offeringsService.getAll).toHaveBeenCalledTimes(
              initialFetchCount + 1,
            );

            // Cleanup
            testQueryClient.clear();
          },
        ),
        { numRuns: 5, endOnFailure: true },
      );
    });

    it("invalida cache después de actualizar offering", async () => {
      await fc.assert(
        fc.asyncProperty(
          createOfferingArb(),
          validNameArb,
          async (offering: OfferingDto, newName: string) => {
            // Reset mocks for each iteration
            vi.clearAllMocks();

            // Create fresh QueryClient for this iteration
            const testQueryClient = new QueryClient({
              defaultOptions: {
                queries: { retry: false, gcTime: 0 },
                mutations: { retry: false },
              },
            });

            const wrapper = ({ children }: { children: ReactNode }) => (
              <QueryClientProvider client={testQueryClient}>
                {children}
              </QueryClientProvider>
            );

            // Setup initial data
            vi.mocked(offeringsService.getAll).mockResolvedValue([offering]);

            // Updated offering response (OfferingDto doesn't have updatedAt)
            const updatedOffering: OfferingDto = {
              ...offering,
              name: newName,
            };
            vi.mocked(offeringsService.update).mockResolvedValue(
              updatedOffering,
            );

            // First, fetch offerings to populate cache
            const { result: offeringsResult } = renderHook(
              () => useOfferings(),
              { wrapper },
            );

            await waitFor(() => {
              expect(offeringsResult.current.isSuccess).toBe(true);
            });

            // Record initial fetch count
            const initialFetchCount = vi.mocked(offeringsService.getAll).mock
              .calls.length;

            // Now update the offering
            const { result: updateResult } = renderHook(
              () => useUpdateOffering(),
              { wrapper },
            );

            // Update mock to return updated list after invalidation
            vi.mocked(offeringsService.getAll).mockResolvedValue([
              updatedOffering,
            ]);

            await act(async () => {
              await updateResult.current.mutateAsync({
                id: offering.id,
                dto: {
                  name: newName,
                  duration: offering.duration,
                  maxCapacityPerSlot: offering.maxCapacityPerSlot,
                  maxDailyCapacity: offering.maxDailyCapacity ?? undefined,
                },
              });
            });

            // Wait for cache invalidation to trigger refetch
            await waitFor(
              () => {
                return (
                  vi.mocked(offeringsService.getAll).mock.calls.length >
                  initialFetchCount
                );
              },
              { timeout: 2000 },
            );

            // Verify getAll was called again after update (cache invalidation)
            expect(offeringsService.getAll).toHaveBeenCalledTimes(
              initialFetchCount + 1,
            );

            // Cleanup
            testQueryClient.clear();
          },
        ),
        { numRuns: 5, endOnFailure: true },
      );
    });

    it("invalida cache después de eliminar offering", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(createOfferingArb(), { minLength: 2, maxLength: 5 }),
          async (offerings: OfferingDto[]) => {
            // Reset mocks for each iteration
            vi.clearAllMocks();

            // Create fresh QueryClient for this iteration
            const testQueryClient = new QueryClient({
              defaultOptions: {
                queries: { retry: false, gcTime: 0 },
                mutations: { retry: false },
              },
            });

            const wrapper = ({ children }: { children: ReactNode }) => (
              <QueryClientProvider client={testQueryClient}>
                {children}
              </QueryClientProvider>
            );

            // Setup initial data
            vi.mocked(offeringsService.getAll).mockResolvedValue(offerings);
            vi.mocked(offeringsService.delete).mockResolvedValue(undefined);

            // First, fetch offerings to populate cache
            const { result: offeringsResult } = renderHook(
              () => useOfferings(),
              { wrapper },
            );

            await waitFor(() => {
              expect(offeringsResult.current.isSuccess).toBe(true);
            });

            // Record initial fetch count
            const initialFetchCount = vi.mocked(offeringsService.getAll).mock
              .calls.length;

            // Pick an offering to delete
            const offeringToDelete = offerings[0];

            // Now delete the offering
            const { result: deleteResult } = renderHook(
              () => useDeleteOffering(),
              { wrapper },
            );

            // Update mock to return list without deleted offering
            const remainingOfferings = offerings.filter(
              (o) => o.id !== offeringToDelete.id,
            );
            vi.mocked(offeringsService.getAll).mockResolvedValue(
              remainingOfferings,
            );

            await act(async () => {
              await deleteResult.current.mutateAsync(offeringToDelete.id);
            });

            // Wait for cache invalidation to trigger refetch
            await waitFor(
              () => {
                return (
                  vi.mocked(offeringsService.getAll).mock.calls.length >
                  initialFetchCount
                );
              },
              { timeout: 2000 },
            );

            // Verify getAll was called again after delete (cache invalidation)
            expect(offeringsService.getAll).toHaveBeenCalledTimes(
              initialFetchCount + 1,
            );

            // Cleanup
            testQueryClient.clear();
          },
        ),
        { numRuns: 5, endOnFailure: true },
      );
    });
  });
});

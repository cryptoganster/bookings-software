/**
 * React Query hooks for Offerings
 *
 * Provides hooks for:
 * - Fetching offerings (all, active, by ID)
 * - Creating offerings
 * - Updating offerings
 * - Deleting offerings
 * - Toggling active status
 *
 * Performance Configuration:
 * - staleTime: 5 minutes (300000ms) - Data considered fresh for 5 minutes
 * - gcTime: 10 minutes (600000ms) - Cache garbage collected after 10 minutes
 * - refetchOnWindowFocus: true - Refetch when window regains focus
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { offeringsService } from "@shared/api/services/offerings.service";
import type {
  OfferingDto,
  CreateOfferingRequestDto,
  UpdateOfferingRequestDto,
} from "@packages/shared-types";

// Performance constants
// Requirements: Performance - 11.3
const STALE_TIME = 5 * 60 * 1000; // 5 minutes
const GC_TIME = 10 * 60 * 1000; // 10 minutes (formerly cacheTime)

// Query Keys
export const offeringKeys = {
  all: ["offerings"] as const,
  lists: () => [...offeringKeys.all, "list"] as const,
  list: (filters?: { activeOnly?: boolean }) =>
    [...offeringKeys.lists(), filters] as const,
  details: () => [...offeringKeys.all, "detail"] as const,
  detail: (id: string) => [...offeringKeys.details(), id] as const,
};

/**
 * Hook to fetch all offerings
 * Configured with performance optimizations
 */
export function useOfferings() {
  return useQuery({
    queryKey: offeringKeys.list(),
    queryFn: () => offeringsService.getAll(),
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook to fetch only active offerings
 * Configured with performance optimizations
 */
export function useActiveOfferings() {
  return useQuery({
    queryKey: offeringKeys.list({ activeOnly: true }),
    queryFn: () => offeringsService.getActive(),
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook to fetch offering by ID
 * Configured with performance optimizations
 */
export function useOffering(id: string) {
  return useQuery({
    queryKey: offeringKeys.detail(id),
    queryFn: () => offeringsService.getById(id),
    enabled: !!id,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook to create offering
 */
export function useCreateOffering() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateOfferingRequestDto) => offeringsService.create(dto),
    onSuccess: () => {
      // Invalidate all offering lists
      queryClient.invalidateQueries({ queryKey: offeringKeys.lists() });
    },
  });
}

/**
 * Hook to update offering
 */
export function useUpdateOffering() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateOfferingRequestDto }) =>
      offeringsService.update(id, dto),
    onSuccess: (data, variables) => {
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: offeringKeys.lists() });
      // Update detail cache
      queryClient.setQueryData<OfferingDto>(
        offeringKeys.detail(variables.id),
        data,
      );
    },
  });
}

/**
 * Hook to delete (deactivate) offering
 */
export function useDeleteOffering() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => offeringsService.delete(id),
    onSuccess: () => {
      // Invalidate all offering queries
      queryClient.invalidateQueries({ queryKey: offeringKeys.all });
    },
  });
}

/**
 * Hook to toggle offering active status
 */
export function useToggleOfferingActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      offeringsService.toggleActive(id, isActive),
    onSuccess: (data, variables) => {
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: offeringKeys.lists() });
      // Update detail cache
      queryClient.setQueryData<OfferingDto>(
        offeringKeys.detail(variables.id),
        data,
      );
    },
  });
}

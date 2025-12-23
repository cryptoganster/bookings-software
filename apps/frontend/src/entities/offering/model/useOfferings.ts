/**
 * React Query hooks for Offerings
 *
 * Provides hooks for:
 * - Fetching offerings (all, active, by ID)
 * - Creating offerings
 * - Updating offerings
 * - Deleting offerings
 * - Toggling active status
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { offeringsService } from "@shared/api/services/offerings.service";
import type {
  OfferingDto,
  CreateOfferingRequestDto,
  UpdateOfferingRequestDto,
} from "@packages/shared-types";

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
 */
export function useOfferings() {
  return useQuery({
    queryKey: offeringKeys.list(),
    queryFn: () => offeringsService.getAll(),
  });
}

/**
 * Hook to fetch only active offerings
 */
export function useActiveOfferings() {
  return useQuery({
    queryKey: offeringKeys.list({ activeOnly: true }),
    queryFn: () => offeringsService.getActive(),
  });
}

/**
 * Hook to fetch offering by ID
 */
export function useOffering(id: string) {
  return useQuery({
    queryKey: offeringKeys.detail(id),
    queryFn: () => offeringsService.getById(id),
    enabled: !!id,
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

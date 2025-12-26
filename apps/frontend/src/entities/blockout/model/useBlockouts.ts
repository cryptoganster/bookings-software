/**
 * React Query hooks for Blockouts
 *
 * Provides hooks for:
 * - Fetching blockouts
 * - Creating blockouts
 * - Deleting blockouts
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { blockoutsService } from "@shared/api/services/blockouts.service";

// Query Keys
export const blockoutKeys = {
  all: ["blockouts"] as const,
  lists: () => [...blockoutKeys.all, "list"] as const,
  list: () => [...blockoutKeys.lists()] as const,
};

/**
 * Hook to fetch all blockouts for the authenticated business
 */
export function useBlockouts() {
  return useQuery({
    queryKey: blockoutKeys.list(),
    queryFn: () => blockoutsService.getAll(),
  });
}

/**
 * Hook to create blockout
 */
export function useCreateBlockout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: {
      startDate: string;
      endDate: string;
      reason?: string;
    }) =>
      blockoutsService.create({
        startDate: dto.startDate,
        endDate: dto.endDate,
        reason: dto.reason || "Bloqueado", // Provide default if not specified
      }),
    onSuccess: () => {
      // Invalidate blockout list
      queryClient.invalidateQueries({ queryKey: blockoutKeys.lists() });
    },
  });
}

/**
 * Hook to delete blockout
 */
export function useDeleteBlockout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => blockoutsService.delete(id),
    onSuccess: () => {
      // Invalidate all blockout queries
      queryClient.invalidateQueries({ queryKey: blockoutKeys.all });
    },
  });
}

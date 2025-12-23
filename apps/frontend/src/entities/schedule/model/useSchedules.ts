/**
 * React Query hooks for Schedules
 *
 * Provides hooks for:
 * - Fetching schedules
 * - Creating schedules
 * - Updating schedules
 * - Deleting schedules
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { schedulesService } from "@shared/api/services/schedules.service";

// Query Keys
export const scheduleKeys = {
  all: ["schedules"] as const,
  lists: () => [...scheduleKeys.all, "list"] as const,
  list: () => [...scheduleKeys.lists()] as const,
};

/**
 * Hook to fetch all schedules for the authenticated business
 */
export function useSchedules() {
  return useQuery({
    queryKey: scheduleKeys.list(),
    queryFn: () => schedulesService.getAll(),
  });
}

/**
 * Hook to create schedule
 */
export function useCreateSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: {
      dayOfWeek: number;
      startTime: string;
      endTime: string;
    }) => schedulesService.create(dto),
    onSuccess: () => {
      // Invalidate schedule list
      queryClient.invalidateQueries({ queryKey: scheduleKeys.lists() });
    },
  });
}

/**
 * Hook to update schedule
 */
export function useUpdateSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      dto,
    }: {
      id: string;
      dto: { startTime: string; endTime: string; isActive?: boolean };
    }) => schedulesService.update(id, dto),
    onSuccess: () => {
      // Invalidate schedule list
      queryClient.invalidateQueries({ queryKey: scheduleKeys.lists() });
    },
  });
}

/**
 * Hook to delete schedule
 */
export function useDeleteSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => schedulesService.delete(id),
    onSuccess: () => {
      // Invalidate all schedule queries
      queryClient.invalidateQueries({ queryKey: scheduleKeys.all });
    },
  });
}

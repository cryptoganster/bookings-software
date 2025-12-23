/**
 * React Query hooks for Conversations
 *
 * Provides hooks for:
 * - Fetching pending admin queries
 * - Fetching conversation by ID
 * - Responding to queries
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { conversationsService } from "@shared/api/services/conversations.service";

// Query Keys
export const conversationKeys = {
  all: ["conversations"] as const,
  pending: () => [...conversationKeys.all, "pending"] as const,
  details: () => [...conversationKeys.all, "detail"] as const,
  detail: (id: string) => [...conversationKeys.details(), id] as const,
};

/**
 * Hook to fetch pending admin queries
 */
export function usePendingQueries() {
  return useQuery({
    queryKey: conversationKeys.pending(),
    queryFn: () => conversationsService.getPending(),
  });
}

/**
 * Hook to fetch conversation by ID
 */
export function useConversation(id: string) {
  return useQuery({
    queryKey: conversationKeys.detail(id),
    queryFn: () => conversationsService.getById(id),
    enabled: !!id,
  });
}

/**
 * Hook to respond to query
 */
export function useRespondToQuery() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, message }: { id: string; message: string }) =>
      conversationsService.respond(id, { message }),
    onSuccess: (_, variables) => {
      // Invalidate pending queries list
      queryClient.invalidateQueries({ queryKey: conversationKeys.pending() });
      // Invalidate the specific conversation
      queryClient.invalidateQueries({
        queryKey: conversationKeys.detail(variables.id),
      });
    },
  });
}

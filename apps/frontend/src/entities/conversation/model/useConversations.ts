/**
 * React Query hooks for Conversations
 *
 * Provides hooks for:
 * - Fetching pending admin queries
 * - Fetching conversation history (messages)
 * - Sending admin responses
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  ConversationReadModel,
  MessageReadModel,
} from "@packages/shared-types";
import { conversationService } from "@shared/api/services/conversation.service";

// Query Keys
export const conversationKeys = {
  all: ["conversations"] as const,
  pending: () => [...conversationKeys.all, "pending"] as const,
  messages: () => [...conversationKeys.all, "messages"] as const,
  conversationMessages: (id: string) =>
    [...conversationKeys.messages(), id] as const,
};

/**
 * Hook to fetch pending admin queries
 *
 * @returns Query with pending conversations
 */
export function useConversations() {
  return useQuery<ConversationReadModel[]>({
    queryKey: conversationKeys.pending(),
    queryFn: conversationService.getPendingConversations,
  });
}

/**
 * Hook to fetch conversation history (messages)
 *
 * @param conversationId - ID of the conversation
 * @returns Query with message history
 */
export function useConversationHistory(conversationId: string) {
  return useQuery<MessageReadModel[]>({
    queryKey: conversationKeys.conversationMessages(conversationId),
    queryFn: () => conversationService.getConversationHistory(conversationId),
    enabled: !!conversationId,
  });
}

/**
 * Hook to send admin response
 *
 * @returns Mutation to send admin response
 */
export function useSendAdminResponse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      conversationId,
      content,
    }: {
      conversationId: string;
      content: string;
    }) => conversationService.sendAdminResponse(conversationId, content),
    onSuccess: (_, { conversationId }) => {
      // Invalidate pending conversations list
      queryClient.invalidateQueries({ queryKey: conversationKeys.pending() });
      // Invalidate the conversation messages
      queryClient.invalidateQueries({
        queryKey: conversationKeys.conversationMessages(conversationId),
      });
    },
  });
}

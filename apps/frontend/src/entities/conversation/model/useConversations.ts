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
 * Automatically refetches every 30 seconds to keep data fresh
 *
 * @returns Query with pending conversations
 */
export function useConversations() {
  return useQuery<ConversationReadModel[]>({
    queryKey: conversationKeys.pending(),
    queryFn: conversationService.getPendingConversations,
    refetchInterval: 30000, // Refetch every 30 seconds
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
 * Implements optimistic updates for better UX:
 * - Immediately updates cache with new message
 * - Reverts on error
 * - Invalidates queries on success
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
    // Optimistic update: Add message to cache immediately
    onMutate: async ({ conversationId, content }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: conversationKeys.conversationMessages(conversationId),
      });

      // Snapshot the previous value
      const previousMessages = queryClient.getQueryData<MessageReadModel[]>(
        conversationKeys.conversationMessages(conversationId),
      );

      // Optimistically update to the new value
      if (previousMessages) {
        const optimisticMessage: MessageReadModel = {
          id: `temp-${Date.now()}`, // Temporary ID
          conversationId,
          direction: "OUTBOUND",
          content,
          messageType: "TEXT",
          sentAt: new Date().toISOString(),
          isFromAdmin: true,
        };

        queryClient.setQueryData<MessageReadModel[]>(
          conversationKeys.conversationMessages(conversationId),
          [...previousMessages, optimisticMessage],
        );
      }

      // Return context with previous value
      return { previousMessages };
    },
    // Revert optimistic update on error
    onError: (_err, { conversationId }, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(
          conversationKeys.conversationMessages(conversationId),
          context.previousMessages,
        );
      }
    },
    // Invalidate and refetch on success
    onSuccess: (_, { conversationId }) => {
      // Invalidate pending conversations list
      queryClient.invalidateQueries({ queryKey: conversationKeys.pending() });
      // Invalidate the conversation messages to get real data from server
      queryClient.invalidateQueries({
        queryKey: conversationKeys.conversationMessages(conversationId),
      });
    },
  });
}

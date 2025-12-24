/**
 * Conversation API Service
 *
 * Handles all API calls related to conversations and messages.
 * Used by React Query hooks in entities/conversation/model/
 */

import type {
  ConversationReadModel,
  MessageReadModel,
  SendAdminResponseDto,
} from "@packages/shared-types";
import { apiClient } from "../client";

export const conversationService = {
  /**
   * Get all pending conversations for the current business
   *
   * @returns Array of conversations awaiting admin response
   */
  getPendingConversations: async (): Promise<ConversationReadModel[]> => {
    const { data } = await apiClient.get<ConversationReadModel[]>(
      "/admin-queries/pending",
    );
    return data;
  },

  /**
   * Get conversation history (all messages)
   *
   * @param conversationId - ID of the conversation
   * @returns Array of messages ordered by sentAt (oldest first)
   */
  getConversationHistory: async (
    conversationId: string,
  ): Promise<MessageReadModel[]> => {
    const { data } = await apiClient.get<MessageReadModel[]>(
      `/admin-queries/${conversationId}/messages`,
    );
    return data;
  },

  /**
   * Send admin response to a conversation
   *
   * @param conversationId - ID of the conversation
   * @param content - Message content to send
   */
  sendAdminResponse: async (
    conversationId: string,
    content: string,
  ): Promise<void> => {
    const dto: SendAdminResponseDto = { content };
    await apiClient.post(`/admin-queries/${conversationId}/respond`, dto);
  },
};

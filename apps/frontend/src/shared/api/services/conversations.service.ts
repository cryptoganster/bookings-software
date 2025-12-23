/**
 * Conversations API Service
 */

import { apiClient } from "../client";
import { ENDPOINTS } from "../endpoints";

export interface ConversationDto {
  id: string;
  businessId: string;
  customerId: string;
  customerName: string | null;
  customerPhone: string;
  status: string;
  lastMessageAt: string;
  messageCount: number;
}

export interface MessageDto {
  id: string;
  conversationId: string;
  direction: string;
  content: string;
  messageType: string;
  sentAt: string;
  isFromAdmin: boolean;
}

export interface RespondToQueryDto {
  message: string;
}

export const conversationsService = {
  async getPending(): Promise<ConversationDto[]> {
    const { data } = await apiClient.get<ConversationDto[]>(
      ENDPOINTS.CONVERSATIONS.PENDING,
    );
    return data;
  },

  async getById(
    id: string,
  ): Promise<{ conversation: ConversationDto; messages: MessageDto[] }> {
    const { data } = await apiClient.get(ENDPOINTS.CONVERSATIONS.DETAIL(id));
    return data;
  },

  async respond(id: string, dto: RespondToQueryDto): Promise<void> {
    await apiClient.post(ENDPOINTS.CONVERSATIONS.RESPOND(id), dto);
  },
};

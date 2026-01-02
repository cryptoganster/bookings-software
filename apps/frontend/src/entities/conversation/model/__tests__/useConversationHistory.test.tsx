/**
 * Tests for useConversationHistory hook
 *
 * Validates: FR-6.2
 * - Query key includes conversationId
 * - Fetches messages for conversation
 * - Enabled only when conversationId is provided
 */

import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { MessageReadModel } from "@packages/shared-types";
import { conversationService } from "@shared/api/services/conversation.service";
import { useConversationHistory, conversationKeys } from "../useConversations";

// Mock the conversation service
vi.mock("@shared/api/services/conversation.service", () => ({
  conversationService: {
    getConversationHistory: vi.fn(),
  },
}));

describe("useConversationHistory", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it("should fetch messages for conversation", async () => {
    // Arrange
    const conversationId = "conv-123";
    const mockMessages: MessageReadModel[] = [
      {
        id: "msg-1",
        conversationId,
        direction: "INBOUND",
        content: "Hello, I need help",
        messageType: "TEXT",
        sentAt: "2024-01-01T10:00:00Z",
        isFromAdmin: false,
      },
      {
        id: "msg-2",
        conversationId,
        direction: "OUTBOUND",
        content: "How can I help you?",
        messageType: "TEXT",
        sentAt: "2024-01-01T10:05:00Z",
        isFromAdmin: true,
      },
    ];

    vi.mocked(conversationService.getConversationHistory).mockResolvedValue(
      mockMessages,
    );

    // Act
    const { result } = renderHook(
      () => useConversationHistory(conversationId),
      { wrapper },
    );

    // Assert
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockMessages);
    expect(conversationService.getConversationHistory).toHaveBeenCalledWith(
      conversationId,
    );
    expect(conversationService.getConversationHistory).toHaveBeenCalledTimes(1);
  });

  it("should use query key that includes conversationId", () => {
    // Arrange
    const conversationId = "conv-456";
    vi.mocked(conversationService.getConversationHistory).mockResolvedValue([]);

    // Act
    renderHook(() => useConversationHistory(conversationId), { wrapper });

    // Assert - Verify query key is correct by checking query state
    const queryState = queryClient.getQueryState(
      conversationKeys.conversationMessages(conversationId),
    );
    expect(queryState).toBeDefined();

    // Verify the key structure includes conversationId
    expect(conversationKeys.conversationMessages(conversationId)).toEqual([
      "conversations",
      "messages",
      conversationId,
    ]);
  });

  it("should be enabled only when conversationId is provided", () => {
    // Arrange
    const conversationId = "conv-789";
    vi.mocked(conversationService.getConversationHistory).mockResolvedValue([]);

    // Act
    const { result } = renderHook(
      () => useConversationHistory(conversationId),
      { wrapper },
    );

    // Assert - Query should be enabled
    expect(result.current.fetchStatus).not.toBe("idle");
  });

  it("should not fetch when conversationId is empty", () => {
    // Arrange
    const conversationId = "";
    vi.mocked(conversationService.getConversationHistory).mockResolvedValue([]);

    // Act
    const { result } = renderHook(
      () => useConversationHistory(conversationId),
      { wrapper },
    );

    // Assert - Query should be disabled
    expect(result.current.fetchStatus).toBe("idle");
    expect(conversationService.getConversationHistory).not.toHaveBeenCalled();
  });

  it("should return loading state initially", () => {
    // Arrange
    const conversationId = "conv-loading";
    vi.mocked(conversationService.getConversationHistory).mockImplementation(
      () => new Promise(() => {}), // Never resolves
    );

    // Act
    const { result } = renderHook(
      () => useConversationHistory(conversationId),
      { wrapper },
    );

    // Assert
    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
  });

  it("should return error state on failure", async () => {
    // Arrange
    const conversationId = "conv-error";
    const error = new Error("Failed to fetch messages");
    vi.mocked(conversationService.getConversationHistory).mockRejectedValue(
      error,
    );

    // Act
    const { result } = renderHook(
      () => useConversationHistory(conversationId),
      { wrapper },
    );

    // Assert
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(error);
  });

  it("should return empty array when no messages", async () => {
    // Arrange
    const conversationId = "conv-empty";
    vi.mocked(conversationService.getConversationHistory).mockResolvedValue([]);

    // Act
    const { result } = renderHook(
      () => useConversationHistory(conversationId),
      { wrapper },
    );

    // Assert
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual([]);
  });

  it("should handle messages in chronological order", async () => {
    // Arrange
    const conversationId = "conv-ordered";
    const mockMessages: MessageReadModel[] = [
      {
        id: "msg-1",
        conversationId,
        direction: "INBOUND",
        content: "First message",
        messageType: "TEXT",
        sentAt: "2024-01-01T10:00:00Z",
        isFromAdmin: false,
      },
      {
        id: "msg-2",
        conversationId,
        direction: "OUTBOUND",
        content: "Second message",
        messageType: "TEXT",
        sentAt: "2024-01-01T10:05:00Z",
        isFromAdmin: true,
      },
      {
        id: "msg-3",
        conversationId,
        direction: "INBOUND",
        content: "Third message",
        messageType: "TEXT",
        sentAt: "2024-01-01T10:10:00Z",
        isFromAdmin: false,
      },
    ];

    vi.mocked(conversationService.getConversationHistory).mockResolvedValue(
      mockMessages,
    );

    // Act
    const { result } = renderHook(
      () => useConversationHistory(conversationId),
      { wrapper },
    );

    // Assert
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const messages = result.current.data!;
    expect(messages).toHaveLength(3);

    // Verify chronological order
    for (let i = 0; i < messages.length - 1; i++) {
      const currentTime = new Date(messages[i].sentAt).getTime();
      const nextTime = new Date(messages[i + 1].sentAt).getTime();
      expect(currentTime).toBeLessThanOrEqual(nextTime);
    }
  });
});

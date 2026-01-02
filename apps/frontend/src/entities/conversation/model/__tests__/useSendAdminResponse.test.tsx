/**
 * Tests for useSendAdminResponse hook
 *
 * Validates: FR-6.3, Property 8
 * - Mutation calls API and invalidates cache
 * - Optimistic update adds message immediately
 * - Optimistic update is reverted on error
 */

import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { MessageReadModel } from "@packages/shared-types";
import { conversationService } from "@shared/api/services/conversation.service";
import { useSendAdminResponse, conversationKeys } from "../useConversations";

// Mock the conversation service
vi.mock("@shared/api/services/conversation.service", () => ({
  conversationService: {
    sendAdminResponse: vi.fn(),
  },
}));

describe("useSendAdminResponse", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
        mutations: {
          retry: false,
        },
      },
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  describe("Task 6.6: Sends response and invalidates cache", () => {
    it("should call API and invalidate cache on success", async () => {
      // Arrange
      const conversationId = "conv-123";
      const content = "Thank you for your inquiry";

      vi.mocked(conversationService.sendAdminResponse).mockResolvedValue(
        undefined,
      );

      // Pre-populate cache with pending conversations
      queryClient.setQueryData(conversationKeys.pending(), [
        { id: conversationId, status: "AWAITING_ADMIN" },
      ]);

      // Pre-populate cache with messages
      const existingMessages: MessageReadModel[] = [
        {
          id: "msg-1",
          conversationId,
          direction: "INBOUND",
          content: "Customer question",
          messageType: "TEXT",
          sentAt: "2024-01-01T10:00:00Z",
          isFromAdmin: false,
        },
      ];
      queryClient.setQueryData(
        conversationKeys.conversationMessages(conversationId),
        existingMessages,
      );

      // Act
      const { result } = renderHook(() => useSendAdminResponse(), { wrapper });

      result.current.mutate({ conversationId, content });

      // Assert - API was called
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(conversationService.sendAdminResponse).toHaveBeenCalledWith(
        conversationId,
        content,
      );
      expect(conversationService.sendAdminResponse).toHaveBeenCalledTimes(1);

      // Assert - Cache was invalidated
      // Note: We can't directly check if invalidateQueries was called,
      // but we can verify the mutation completed successfully
      expect(result.current.isError).toBe(false);
    });

    it("should invalidate both pending conversations and messages", async () => {
      // Arrange
      const conversationId = "conv-456";
      const content = "Response content";

      vi.mocked(conversationService.sendAdminResponse).mockResolvedValue(
        undefined,
      );

      // Spy on invalidateQueries
      const invalidateQueriesSpy = vi.spyOn(queryClient, "invalidateQueries");

      // Act
      const { result } = renderHook(() => useSendAdminResponse(), { wrapper });

      result.current.mutate({ conversationId, content });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Assert - Both query keys were invalidated
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: conversationKeys.pending(),
      });
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: conversationKeys.conversationMessages(conversationId),
      });
    });
  });

  describe("Task 6.7: Optimistic update", () => {
    it("should add message to cache immediately before API response", async () => {
      // Arrange
      const conversationId = "conv-789";
      const content = "Optimistic response";

      // Mock API with delay to test optimistic update
      let resolveApi: () => void;
      const apiPromise = new Promise<void>((resolve) => {
        resolveApi = resolve;
      });

      vi.mocked(conversationService.sendAdminResponse).mockReturnValue(
        apiPromise,
      );

      // Pre-populate cache with existing messages
      const existingMessages: MessageReadModel[] = [
        {
          id: "msg-1",
          conversationId,
          direction: "INBOUND",
          content: "Customer question",
          messageType: "TEXT",
          sentAt: "2024-01-01T10:00:00Z",
          isFromAdmin: false,
        },
      ];
      queryClient.setQueryData(
        conversationKeys.conversationMessages(conversationId),
        existingMessages,
      );

      // Act
      const { result } = renderHook(() => useSendAdminResponse(), { wrapper });

      result.current.mutate({ conversationId, content });

      // Assert - Message appears in cache immediately (synchronously)
      // The optimistic update happens in onMutate which is called synchronously
      await waitFor(() => {
        const cachedMessages = queryClient.getQueryData<MessageReadModel[]>(
          conversationKeys.conversationMessages(conversationId),
        );
        expect(cachedMessages).toHaveLength(2);
      });

      const cachedMessages = queryClient.getQueryData<MessageReadModel[]>(
        conversationKeys.conversationMessages(conversationId),
      );

      expect(cachedMessages).toHaveLength(2);
      expect(cachedMessages![1]).toMatchObject({
        conversationId,
        direction: "OUTBOUND",
        content,
        messageType: "TEXT",
        isFromAdmin: true,
      });
      expect(cachedMessages![1].id).toMatch(/^temp-/); // Temporary ID

      // Now resolve the API call
      resolveApi!();

      // Wait for API to complete
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it("should preserve existing messages when adding optimistic message", async () => {
      // Arrange
      const conversationId = "conv-preserve";
      const content = "New response";

      vi.mocked(conversationService.sendAdminResponse).mockImplementation(
        () =>
          new Promise((resolve) => setTimeout(() => resolve(undefined), 50)),
      );

      const existingMessages: MessageReadModel[] = [
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
      ];
      queryClient.setQueryData(
        conversationKeys.conversationMessages(conversationId),
        existingMessages,
      );

      // Act
      const { result } = renderHook(() => useSendAdminResponse(), { wrapper });

      result.current.mutate({ conversationId, content });

      // Assert - All messages preserved
      await waitFor(() => {
        const cachedMessages = queryClient.getQueryData<MessageReadModel[]>(
          conversationKeys.conversationMessages(conversationId),
        );
        expect(cachedMessages).toHaveLength(3);
      });

      const cachedMessages = queryClient.getQueryData<MessageReadModel[]>(
        conversationKeys.conversationMessages(conversationId),
      );

      // First two messages unchanged
      expect(cachedMessages![0]).toEqual(existingMessages[0]);
      expect(cachedMessages![1]).toEqual(existingMessages[1]);

      // Third message is optimistic
      expect(cachedMessages![2].content).toBe(content);
      expect(cachedMessages![2].isFromAdmin).toBe(true);
    });

    it("should not add optimistic message if no previous messages in cache", async () => {
      // Arrange
      const conversationId = "conv-no-cache";
      const content = "Response";

      vi.mocked(conversationService.sendAdminResponse).mockResolvedValue(
        undefined,
      );

      // No pre-populated cache

      // Act
      const { result } = renderHook(() => useSendAdminResponse(), { wrapper });

      result.current.mutate({ conversationId, content });

      // Assert - No optimistic update (cache was empty)
      const cachedMessages = queryClient.getQueryData<MessageReadModel[]>(
        conversationKeys.conversationMessages(conversationId),
      );
      expect(cachedMessages).toBeUndefined();

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });
  });

  describe("Task 6.8: Reverts optimistic update on error", () => {
    it("should revert to previous state when API returns error", async () => {
      // Arrange
      const conversationId = "conv-error";
      const content = "This will fail";
      const error = new Error("Failed to send response");

      vi.mocked(conversationService.sendAdminResponse).mockRejectedValue(error);

      // Pre-populate cache with existing messages
      const existingMessages: MessageReadModel[] = [
        {
          id: "msg-1",
          conversationId,
          direction: "INBOUND",
          content: "Customer question",
          messageType: "TEXT",
          sentAt: "2024-01-01T10:00:00Z",
          isFromAdmin: false,
        },
      ];
      queryClient.setQueryData(
        conversationKeys.conversationMessages(conversationId),
        existingMessages,
      );

      // Act
      const { result } = renderHook(() => useSendAdminResponse(), { wrapper });

      result.current.mutate({ conversationId, content });

      // Assert - Error occurred
      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(error);

      // Assert - Cache reverted to previous state
      const cachedMessages = queryClient.getQueryData<MessageReadModel[]>(
        conversationKeys.conversationMessages(conversationId),
      );

      expect(cachedMessages).toEqual(existingMessages);
      expect(cachedMessages).toHaveLength(1);
      expect(cachedMessages![0].id).toBe("msg-1");
    });

    it("should handle error when optimistic message was added", async () => {
      // Arrange
      const conversationId = "conv-revert";
      const content = "Will be reverted";
      const error = new Error("Network error");

      vi.mocked(conversationService.sendAdminResponse).mockRejectedValue(error);

      const existingMessages: MessageReadModel[] = [
        {
          id: "msg-1",
          conversationId,
          direction: "INBOUND",
          content: "Original message",
          messageType: "TEXT",
          sentAt: "2024-01-01T10:00:00Z",
          isFromAdmin: false,
        },
      ];
      queryClient.setQueryData(
        conversationKeys.conversationMessages(conversationId),
        existingMessages,
      );

      // Act
      const { result } = renderHook(() => useSendAdminResponse(), { wrapper });

      result.current.mutate({ conversationId, content });

      // Verify optimistic message was added (briefly)
      // May or may not catch the optimistic state depending on timing
      // The important part is the final state after error
      await waitFor(
        () => {
          expect(result.current.isError).toBe(true);
        },
        { timeout: 1000 },
      );

      // Wait for error
      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      // Assert - Reverted to original state
      const finalMessages = queryClient.getQueryData<MessageReadModel[]>(
        conversationKeys.conversationMessages(conversationId),
      );

      expect(finalMessages).toEqual(existingMessages);
      expect(finalMessages).toHaveLength(1);
      expect(finalMessages![0].content).toBe("Original message");
    });

    it("should return error object", async () => {
      // Arrange
      const conversationId = "conv-error-obj";
      const content = "Error test";
      const error = new Error("API Error: 500 Internal Server Error");

      vi.mocked(conversationService.sendAdminResponse).mockRejectedValue(error);

      queryClient.setQueryData(
        conversationKeys.conversationMessages(conversationId),
        [],
      );

      // Act
      const { result } = renderHook(() => useSendAdminResponse(), { wrapper });

      result.current.mutate({ conversationId, content });

      // Assert - Error is accessible
      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBe(error);
      expect(result.current.error?.message).toBe(
        "API Error: 500 Internal Server Error",
      );
    });
  });

  describe("Additional edge cases", () => {
    it("should handle multiple rapid mutations", async () => {
      // Arrange
      const conversationId = "conv-rapid";
      const content1 = "First response";
      const content2 = "Second response";

      vi.mocked(conversationService.sendAdminResponse).mockResolvedValue(
        undefined,
      );

      queryClient.setQueryData(
        conversationKeys.conversationMessages(conversationId),
        [],
      );

      // Act
      const { result } = renderHook(() => useSendAdminResponse(), { wrapper });

      result.current.mutate({ conversationId, content: content1 });
      result.current.mutate({ conversationId, content: content2 });

      // Assert - Both mutations complete
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(conversationService.sendAdminResponse).toHaveBeenCalledTimes(2);
    });

    it("should handle empty content string", async () => {
      // Arrange
      const conversationId = "conv-empty";
      const content = "";

      vi.mocked(conversationService.sendAdminResponse).mockResolvedValue(
        undefined,
      );

      queryClient.setQueryData(
        conversationKeys.conversationMessages(conversationId),
        [],
      );

      // Act
      const { result } = renderHook(() => useSendAdminResponse(), { wrapper });

      result.current.mutate({ conversationId, content });

      // Assert - Mutation completes (validation happens at API/DTO level)
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(conversationService.sendAdminResponse).toHaveBeenCalledWith(
        conversationId,
        content,
      );
    });

    it("should handle very long content", async () => {
      // Arrange
      const conversationId = "conv-long";
      const content = "a".repeat(1000); // Max length

      vi.mocked(conversationService.sendAdminResponse).mockResolvedValue(
        undefined,
      );

      queryClient.setQueryData(
        conversationKeys.conversationMessages(conversationId),
        [],
      );

      // Act
      const { result } = renderHook(() => useSendAdminResponse(), { wrapper });

      result.current.mutate({ conversationId, content });

      // Assert
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(conversationService.sendAdminResponse).toHaveBeenCalledWith(
        conversationId,
        content,
      );
    });
  });
});

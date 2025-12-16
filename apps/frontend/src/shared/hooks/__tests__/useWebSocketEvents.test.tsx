/**
 * useWebSocketEvents Hook Tests
 *
 * Tests for WebSocket event listening and query invalidation.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useWebSocketEvents } from "../useWebSocketEvents";
import * as websocketModule from "@shared/api/websocket";
import { Socket } from "socket.io-client";

// Mock websocket module
vi.mock("@shared/api/websocket", () => ({
  getWebSocket: vi.fn(),
  WS_EVENTS: {
    APPOINTMENT_CREATED: "appointment:created",
    APPOINTMENT_CANCELLED: "appointment:cancelled",
    APPOINTMENT_MODIFIED: "appointment:modified",
  },
}));

describe("useWebSocketEvents", () => {
  let queryClient: QueryClient;
  let mockSocket: Partial<Socket>;
  let eventHandlers: Record<string, (...args: unknown[]) => void>;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Create fresh query client
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    // Track event handlers
    eventHandlers = {};

    // Create mock socket with proper typing
    /* eslint-disable @typescript-eslint/no-explicit-any */
    mockSocket = {
      on: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
        eventHandlers[event] = handler;
        return mockSocket as Socket; // Return socket for chaining
      }) as any, // Use 'any' to bypass complex Socket.io typing
      off: vi.fn(() => {
        return mockSocket as Socket; // Return socket for chaining
      }) as any, // Use 'any' to bypass complex Socket.io typing
    };
    /* eslint-enable @typescript-eslint/no-explicit-any */

    // Mock getWebSocket to return mock socket
    vi.mocked(websocketModule.getWebSocket).mockReturnValue(
      mockSocket as Socket,
    );
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it("should subscribe to WebSocket events on mount", () => {
    // Act
    renderHook(() => useWebSocketEvents(), { wrapper });

    // Assert
    expect(mockSocket.on).toHaveBeenCalledWith(
      "appointment:created",
      expect.any(Function),
    );
    expect(mockSocket.on).toHaveBeenCalledWith(
      "appointment:cancelled",
      expect.any(Function),
    );
    expect(mockSocket.on).toHaveBeenCalledWith(
      "appointment:modified",
      expect.any(Function),
    );
  });

  it("should unsubscribe from WebSocket events on unmount", () => {
    // Act
    const { unmount } = renderHook(() => useWebSocketEvents(), { wrapper });
    unmount();

    // Assert
    expect(mockSocket.off).toHaveBeenCalledWith(
      "appointment:created",
      expect.any(Function),
    );
    expect(mockSocket.off).toHaveBeenCalledWith(
      "appointment:cancelled",
      expect.any(Function),
    );
    expect(mockSocket.off).toHaveBeenCalledWith(
      "appointment:modified",
      expect.any(Function),
    );
  });

  it("should not throw if WebSocket is not available", () => {
    // Arrange
    vi.mocked(websocketModule.getWebSocket).mockReturnValue(null);

    // Act & Assert
    expect(() => {
      renderHook(() => useWebSocketEvents(), { wrapper });
    }).not.toThrow();
  });

  it("should invalidate queries on appointment:created event", async () => {
    // Arrange
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    renderHook(() => useWebSocketEvents(), { wrapper });

    // Act
    const handler = eventHandlers["appointment:created"];
    handler({
      appointmentId: "appt-123",
      customerId: "cust-123",
      offeringId: "off-123",
      dateTime: "2024-01-01T10:00:00Z",
      timestamp: "2024-01-01T09:00:00Z",
    });

    // Assert
    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ["appointments", "list"],
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ["appointments", "upcoming"],
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ["appointments", "today"],
      });
    });
  });

  it("should invalidate queries on appointment:cancelled event", async () => {
    // Arrange
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    renderHook(() => useWebSocketEvents(), { wrapper });

    // Act
    const handler = eventHandlers["appointment:cancelled"];
    handler({
      appointmentId: "appt-123",
      timestamp: "2024-01-01T09:00:00Z",
    });

    // Assert
    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ["appointments", "list"],
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ["appointments", "detail", "appt-123"],
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ["appointments", "upcoming"],
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ["appointments", "today"],
      });
    });
  });

  it("should invalidate queries on appointment:modified event", async () => {
    // Arrange
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    renderHook(() => useWebSocketEvents(), { wrapper });

    // Act
    const handler = eventHandlers["appointment:modified"];
    handler({
      appointmentId: "appt-123",
      newDateTime: "2024-01-02T10:00:00Z",
      timestamp: "2024-01-01T09:00:00Z",
    });

    // Assert
    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ["appointments", "list"],
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ["appointments", "detail", "appt-123"],
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ["appointments", "upcoming"],
      });
    });
  });

  it("should handle multiple events correctly", async () => {
    // Arrange
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    renderHook(() => useWebSocketEvents(), { wrapper });

    // Act - Trigger multiple events
    eventHandlers["appointment:created"]({
      appointmentId: "appt-1",
      customerId: "cust-1",
      offeringId: "off-1",
      dateTime: "2024-01-01T10:00:00Z",
      timestamp: "2024-01-01T09:00:00Z",
    });

    eventHandlers["appointment:cancelled"]({
      appointmentId: "appt-2",
      timestamp: "2024-01-01T09:00:00Z",
    });

    // Assert
    await waitFor(() => {
      // Should have been called for both events
      expect(invalidateSpy).toHaveBeenCalledTimes(7); // 3 for created + 4 for cancelled
    });
  });
});

/**
 * WebSocket Client Tests
 *
 * Tests for WebSocket connection management and event handling.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { io, Socket } from "socket.io-client";
import {
  connectWebSocket,
  disconnectWebSocket,
  getWebSocket,
  isWebSocketConnected,
  WS_EVENTS,
} from "../websocket";
import { useAuthStore } from "@app/store/auth.store";

// Mock socket.io-client
vi.mock("socket.io-client", () => ({
  io: vi.fn(),
}));

// Mock auth store
vi.mock("@app/store/auth.store", () => ({
  useAuthStore: {
    getState: vi.fn(),
  },
}));

describe("WebSocket Client", () => {
  let mockSocket: Partial<Socket>;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Create mock socket
    mockSocket = {
      connected: false,
      on: vi.fn(),
      off: vi.fn(),
      disconnect: vi.fn(),
    };

    // Mock io to return mock socket
    vi.mocked(io).mockReturnValue(mockSocket as Socket);
  });

  afterEach(() => {
    // Clean up
    disconnectWebSocket();
  });

  describe("connectWebSocket", () => {
    it("should not connect if user has no businessId", () => {
      // Arrange
      vi.mocked(useAuthStore.getState).mockReturnValue({
        user: {
          id: "1",
          email: "test@test.com",
          name: "Test",
          roles: ["BUSINESS_OWNER"],
          isActive: true,
          emailVerified: true,
          createdAt: "2024-01-01",
        },
        token: "token",
        isAuthenticated: true,
        login: vi.fn(),
        logout: vi.fn(),
      });

      // Act
      const socket = connectWebSocket();

      // Assert
      expect(socket).toBeNull();
      expect(io).not.toHaveBeenCalled();
    });

    it("should connect with businessId authentication", () => {
      // Arrange
      vi.mocked(useAuthStore.getState).mockReturnValue({
        user: {
          id: "1",
          email: "test@test.com",
          name: "Test",
          roles: ["BUSINESS_OWNER"],
          isActive: true,
          emailVerified: true,
          createdAt: "2024-01-01",
        },
        token: "token",
        isAuthenticated: true,
        login: vi.fn(),
        logout: vi.fn(),
      });

      // Act
      const socket = connectWebSocket();

      // Assert
      expect(socket).toBe(mockSocket);
      expect(io).toHaveBeenCalledWith(
        expect.stringContaining("/events"),
        expect.objectContaining({
          auth: {
            roles: ["BUSINESS_OWNER"],
            isActive: true,
            emailVerified: true,
          },
          transports: ["websocket"],
        }),
      );
    });

    it("should return existing socket if already connected", () => {
      // Arrange
      vi.mocked(useAuthStore.getState).mockReturnValue({
        user: {
          id: "1",
          email: "test@test.com",
          name: "Test",
          roles: ["BUSINESS_OWNER"],
          isActive: true,
          emailVerified: true,
          createdAt: "2024-01-01",
        },
        token: "token",
        isAuthenticated: true,
        login: vi.fn(),
        logout: vi.fn(),
      });
      mockSocket.connected = true;

      // Act
      const socket1 = connectWebSocket();
      const socket2 = connectWebSocket();

      // Assert
      expect(socket1).toBe(socket2);
      expect(io).toHaveBeenCalledTimes(1);
    });

    it("should register connection event handlers", () => {
      // Arrange
      vi.mocked(useAuthStore.getState).mockReturnValue({
        user: {
          id: "1",
          email: "test@test.com",
          name: "Test",
          roles: ["BUSINESS_OWNER"],
          isActive: true,
          emailVerified: true,
          createdAt: "2024-01-01",
        },
        token: "token",
        isAuthenticated: true,
        login: vi.fn(),
        logout: vi.fn(),
      });

      // Act
      connectWebSocket();

      // Assert
      expect(mockSocket.on).toHaveBeenCalledWith(
        WS_EVENTS.CONNECT,
        expect.any(Function),
      );
      expect(mockSocket.on).toHaveBeenCalledWith(
        WS_EVENTS.DISCONNECT,
        expect.any(Function),
      );
      expect(mockSocket.on).toHaveBeenCalledWith(
        WS_EVENTS.CONNECT_ERROR,
        expect.any(Function),
      );
    });
  });

  describe("disconnectWebSocket", () => {
    it("should disconnect socket if connected", () => {
      // Arrange
      vi.mocked(useAuthStore.getState).mockReturnValue({
        user: {
          id: "1",
          email: "test@test.com",
          name: "Test",
          roles: ["BUSINESS_OWNER"],
          isActive: true,
          emailVerified: true,
          createdAt: "2024-01-01",
        },
        token: "token",
        isAuthenticated: true,
        login: vi.fn(),
        logout: vi.fn(),
      });
      connectWebSocket();

      // Act
      disconnectWebSocket();

      // Assert
      expect(mockSocket.disconnect).toHaveBeenCalled();
    });

    it("should not throw if socket is null", () => {
      // Act & Assert
      expect(() => disconnectWebSocket()).not.toThrow();
    });
  });

  describe("getWebSocket", () => {
    it("should return null if not connected", () => {
      // Act
      const socket = getWebSocket();

      // Assert
      expect(socket).toBeNull();
    });

    it("should return socket if connected", () => {
      // Arrange
      vi.mocked(useAuthStore.getState).mockReturnValue({
        user: {
          id: "1",
          email: "test@test.com",
          name: "Test",
          roles: ["BUSINESS_OWNER"],
          isActive: true,
          emailVerified: true,
          createdAt: "2024-01-01",
        },
        token: "token",
        isAuthenticated: true,
        login: vi.fn(),
        logout: vi.fn(),
      });
      connectWebSocket();

      // Act
      const socket = getWebSocket();

      // Assert
      expect(socket).toBe(mockSocket);
    });
  });

  describe("isWebSocketConnected", () => {
    it("should return false if not connected", () => {
      // Act
      const connected = isWebSocketConnected();

      // Assert
      expect(connected).toBe(false);
    });

    it("should return true if connected", () => {
      // Arrange
      vi.mocked(useAuthStore.getState).mockReturnValue({
        user: {
          id: "1",
          email: "test@test.com",
          name: "Test",
          roles: ["BUSINESS_OWNER"],
          isActive: true,
          emailVerified: true,
          createdAt: "2024-01-01",
        },
        token: "token",
        isAuthenticated: true,
        login: vi.fn(),
        logout: vi.fn(),
      });
      mockSocket.connected = true;
      connectWebSocket();

      // Act
      const connected = isWebSocketConnected();

      // Assert
      expect(connected).toBe(true);
    });
  });

  describe("WS_EVENTS", () => {
    it("should have correct event names", () => {
      expect(WS_EVENTS.APPOINTMENT_CREATED).toBe("appointment:created");
      expect(WS_EVENTS.APPOINTMENT_CANCELLED).toBe("appointment:cancelled");
      expect(WS_EVENTS.APPOINTMENT_MODIFIED).toBe("appointment:modified");
      expect(WS_EVENTS.CONNECT).toBe("connect");
      expect(WS_EVENTS.DISCONNECT).toBe("disconnect");
      expect(WS_EVENTS.CONNECT_ERROR).toBe("connect_error");
    });
  });
});

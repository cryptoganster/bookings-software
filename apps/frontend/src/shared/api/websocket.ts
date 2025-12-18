/**
 * WebSocket Client
 *
 * Manages WebSocket connection to backend for real-time updates.
 * Uses Socket.IO client with multi-tenancy support via businessId rooms.
 *
 * Features:
 * - Automatic connection/disconnection based on auth state
 * - Multi-tenancy isolation via businessId
 * - Reconnection handling
 * - Type-safe event listeners
 */

import { io, Socket } from "socket.io-client";
import { useAuthStore } from "@app/store/auth.store";
import { env } from "@shared/config/env";

let socket: Socket | null = null;

/**
 * WebSocket Events
 *
 * Type-safe event names for WebSocket communication
 */
export const WS_EVENTS = {
  // Appointment events
  APPOINTMENT_CREATED: "appointment:created",
  APPOINTMENT_CANCELLED: "appointment:cancelled",
  APPOINTMENT_MODIFIED: "appointment:modified",

  // Connection events
  CONNECT: "connect",
  DISCONNECT: "disconnect",
  CONNECT_ERROR: "connect_error",
} as const;

/**
 * WebSocket Event Payloads
 */
export interface AppointmentCreatedPayload {
  appointmentId: string;
  customerId: string;
  offeringId: string;
  dateTime: string;
  timestamp: string;
}

export interface AppointmentCancelledPayload {
  appointmentId: string;
  timestamp: string;
}

export interface AppointmentModifiedPayload {
  appointmentId: string;
  newDateTime: string;
  timestamp: string;
}

/**
 * Connect to WebSocket server
 *
 * Establishes connection with businessId authentication.
 * Only connects if user is authenticated and has a businessId.
 *
 * @returns Socket instance or null if connection failed
 *
 * @example
 * ```ts
 * const socket = connectWebSocket();
 * if (socket) {
 *   console.log('Connected to WebSocket');
 * }
 * ```
 */
export function connectWebSocket(): Socket | null {
  const user = useAuthStore.getState().user;

  if (!user?.id) {
    console.warn("[WebSocket] Cannot connect: no user");
    return null;
  }

  // TODO: WebSocket needs businessId but UserDto no longer has it
  // Need to fetch business data first or pass businessId separately
  // For now, using userId as fallback
  console.warn("[WebSocket] Using userId as businessId (temporary)");

  // Already connected
  if (socket?.connected) {
    console.log("[WebSocket] Already connected");
    return socket;
  }

  // Create new connection
  const wsUrl = env.apiUrl.replace(/^http/, "ws");
  socket = io(`${wsUrl}/events`, {
    auth: {
      businessId: user.id, // TODO: Should be actual businessId
    },
    transports: ["websocket"], // Force WebSocket (no polling)
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
  });

  // Connection event handlers
  socket.on(WS_EVENTS.CONNECT, () => {
    console.log("[WebSocket] ✅ Connected");
  });

  socket.on(WS_EVENTS.DISCONNECT, (reason) => {
    console.log("[WebSocket] ❌ Disconnected:", reason);
  });

  socket.on(WS_EVENTS.CONNECT_ERROR, (error) => {
    console.error("[WebSocket] Connection error:", error);
  });

  return socket;
}

/**
 * Disconnect from WebSocket server
 *
 * Closes the connection and cleans up resources.
 *
 * @example
 * ```ts
 * disconnectWebSocket();
 * ```
 */
export function disconnectWebSocket(): void {
  if (socket) {
    console.log("[WebSocket] Disconnecting...");
    socket.disconnect();
    socket = null;
  }
}

/**
 * Get current WebSocket instance
 *
 * @returns Current socket instance or null if not connected
 *
 * @example
 * ```ts
 * const socket = getWebSocket();
 * if (socket) {
 *   socket.on('appointment:created', handleEvent);
 * }
 * ```
 */
export function getWebSocket(): Socket | null {
  return socket;
}

/**
 * Check if WebSocket is connected
 *
 * @returns true if connected, false otherwise
 *
 * @example
 * ```ts
 * if (isWebSocketConnected()) {
 *   console.log('WebSocket is active');
 * }
 * ```
 */
export function isWebSocketConnected(): boolean {
  return socket?.connected ?? false;
}

/**
 * useWebSocketEvents Hook
 *
 * Listens to WebSocket events and invalidates TanStack Query caches
 * to trigger automatic refetching of data.
 *
 * This hook should be used at the app level to ensure all components
 * receive real-time updates when data changes on the backend.
 *
 * Features:
 * - Automatic query invalidation on domain events
 * - Type-safe event handling
 * - Cleanup on unmount
 * - Logging for debugging
 *
 * @example
 * ```tsx
 * function App() {
 *   useWebSocketEvents(); // Enable real-time updates
 *   return <RouterProvider router={router} />;
 * }
 * ```
 */

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getWebSocket,
  WS_EVENTS,
  type AppointmentCreatedPayload,
  type AppointmentCancelledPayload,
  type AppointmentModifiedPayload,
} from "@shared/api/websocket";
import { appointmentKeys } from "@entities/appointment/model/queries";

/**
 * Hook to listen to WebSocket events and invalidate queries
 *
 * Automatically subscribes to WebSocket events and invalidates
 * relevant TanStack Query caches to trigger refetching.
 *
 * Requirements:
 * - 3.1: Real-time updates for appointments
 * - 3.2: Multi-tenancy isolation (handled by backend rooms)
 *
 * @example
 * ```tsx
 * function App() {
 *   useWebSocketEvents();
 *   return <RouterProvider router={router} />;
 * }
 * ```
 */
export function useWebSocketEvents() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const socket = getWebSocket();

    if (!socket) {
      console.warn("[useWebSocketEvents] No WebSocket connection available");
      return;
    }

    console.log("[useWebSocketEvents] Subscribing to WebSocket events");

    /**
     * Handle appointment:created event
     *
     * Invalidates:
     * - All appointment lists (to show new appointment)
     * - Upcoming appointments (dashboard widget)
     * - Today appointments (dashboard widget)
     */
    const handleAppointmentCreated = (data: AppointmentCreatedPayload) => {
      console.log("[WebSocket] 📨 Appointment created:", data);

      // Invalidate queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: appointmentKeys.upcoming() });
      queryClient.invalidateQueries({ queryKey: appointmentKeys.today() });

      // Note: Stats queries will be added when StatsCards widget is implemented
      // queryClient.invalidateQueries({ queryKey: statsKeys.current() });
    };

    /**
     * Handle appointment:cancelled event
     *
     * Invalidates:
     * - All appointment lists (to update status)
     * - Specific appointment detail (if viewing)
     * - Upcoming appointments (may be removed from list)
     * - Today appointments (may be removed from list)
     */
    const handleAppointmentCancelled = (data: AppointmentCancelledPayload) => {
      console.log("[WebSocket] 📨 Appointment cancelled:", data);

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: appointmentKeys.detail(data.appointmentId),
      });
      queryClient.invalidateQueries({ queryKey: appointmentKeys.upcoming() });
      queryClient.invalidateQueries({ queryKey: appointmentKeys.today() });

      // Note: Stats queries will be added when StatsCards widget is implemented
      // queryClient.invalidateQueries({ queryKey: statsKeys.current() });
    };

    /**
     * Handle appointment:modified event
     *
     * Invalidates:
     * - All appointment lists (to update date/time)
     * - Specific appointment detail (if viewing)
     * - Upcoming appointments (order may change)
     */
    const handleAppointmentModified = (data: AppointmentModifiedPayload) => {
      console.log("[WebSocket] 📨 Appointment modified:", data);

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: appointmentKeys.detail(data.appointmentId),
      });
      queryClient.invalidateQueries({ queryKey: appointmentKeys.upcoming() });
    };

    // Subscribe to events
    socket.on(WS_EVENTS.APPOINTMENT_CREATED, handleAppointmentCreated);
    socket.on(WS_EVENTS.APPOINTMENT_CANCELLED, handleAppointmentCancelled);
    socket.on(WS_EVENTS.APPOINTMENT_MODIFIED, handleAppointmentModified);

    // Cleanup on unmount
    return () => {
      console.log("[useWebSocketEvents] Unsubscribing from WebSocket events");
      socket.off(WS_EVENTS.APPOINTMENT_CREATED, handleAppointmentCreated);
      socket.off(WS_EVENTS.APPOINTMENT_CANCELLED, handleAppointmentCancelled);
      socket.off(WS_EVENTS.APPOINTMENT_MODIFIED, handleAppointmentModified);
    };
  }, [queryClient]);
}

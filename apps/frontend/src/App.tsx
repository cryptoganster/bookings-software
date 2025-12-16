/**
 * App Component
 *
 * Componente raíz de la aplicación.
 * Configura el router con rutas públicas y protegidas.
 * Gestiona la conexión WebSocket para actualizaciones en tiempo real.
 */

import { useEffect } from "react";
import { RouterProvider } from "react-router-dom";
import { router } from "./app/router";
import { useAuthStore } from "./app/store/auth.store";
import { connectWebSocket, disconnectWebSocket } from "./shared/api/websocket";
import { useWebSocketEvents } from "./shared/hooks/useWebSocketEvents";

/**
 * App Root Component
 *
 * Inicializa el router de la aplicación con todas las rutas configuradas.
 * Gestiona la conexión WebSocket basada en el estado de autenticación.
 *
 * Requirements:
 * - 2.1: Sistema de rutas con protección de autenticación
 * - 3.1: Actualizaciones en tiempo real vía WebSocket
 * - 3.2: Multi-tenancy con aislamiento por businessId
 *
 * @example
 * ```tsx
 * <AppProviders>
 *   <App />
 * </AppProviders>
 * ```
 */
function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Manage WebSocket connection based on auth state
  useEffect(() => {
    if (isAuthenticated) {
      console.log("[App] User authenticated, connecting WebSocket...");
      connectWebSocket();
    } else {
      console.log("[App] User not authenticated, disconnecting WebSocket...");
      disconnectWebSocket();
    }

    // Cleanup on unmount
    return () => {
      disconnectWebSocket();
    };
  }, [isAuthenticated]);

  // Listen to WebSocket events and invalidate queries
  useWebSocketEvents();

  return <RouterProvider router={router} />;
}

export default App;

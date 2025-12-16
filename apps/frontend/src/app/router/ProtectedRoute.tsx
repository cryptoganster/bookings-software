/**
 * ProtectedRoute Component
 *
 * Guard de autenticación para rutas protegidas.
 * Redirige a /login si el usuario no está autenticado.
 */

import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@app/store/auth.store";

/**
 * Protected Route Guard
 *
 * Verifica si el usuario está autenticado antes de permitir acceso.
 * Si no está autenticado, redirige a la página de login.
 *
 * Requirements:
 * - 2.1: Redirección a login para usuarios no autenticados
 * - 2.4: Protección de rutas que requieren autenticación
 *
 * @example
 * ```tsx
 * <Route element={<ProtectedRoute />}>
 *   <Route path="/" element={<DashboardPage />} />
 *   <Route path="/appointments" element={<AppointmentsPage />} />
 * </Route>
 * ```
 */
export function ProtectedRoute() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    // Redirigir a login si no está autenticado
    // replace: true para evitar que el usuario pueda volver con el botón atrás
    return <Navigate to="/login" replace />;
  }

  // Renderizar rutas hijas si está autenticado
  return <Outlet />;
}

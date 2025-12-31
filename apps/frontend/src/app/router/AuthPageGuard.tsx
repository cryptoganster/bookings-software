/**
 * AuthPageGuard Component
 *
 * Guard para páginas de autenticación (login, register).
 * Redirige a usuarios autenticados a su dashboard correspondiente según su rol.
 *
 * Requirements:
 * - FR-4.2: Usuarios autenticados no deben acceder a /login o /register
 */

import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@app/store/auth.store";
import { getRedirectPathForRoles } from "@features/auth/login/model/useLogin";

/**
 * Auth Page Guard
 *
 * Verifica si el usuario ya está autenticado antes de mostrar páginas de auth.
 * Si está autenticado, redirige al dashboard correspondiente según su rol.
 *
 * Redirección basada en roles:
 * - BUSINESS_OWNER -> / (dashboard)
 * - ADMIN -> /admin
 * - CUSTOMER -> /my-appointments
 *
 * @example
 * ```tsx
 * <Route element={<AuthPageGuard />}>
 *   <Route path="/login" element={<LoginPage />} />
 *   <Route path="/register" element={<RegisterPage />} />
 * </Route>
 * ```
 */
export function AuthPageGuard() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  if (isAuthenticated && user) {
    // Redirigir a dashboard según rol del usuario
    const redirectPath = getRedirectPathForRoles(user.roles);
    return <Navigate to={redirectPath} replace />;
  }

  // Renderizar rutas hijas si no está autenticado
  return <Outlet />;
}

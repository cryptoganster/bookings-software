/**
 * Router Configuration
 *
 * Define todas las rutas de la aplicación con React Router v6.
 * Incluye rutas públicas y protegidas con DashboardLayout.
 */

import { createBrowserRouter } from "react-router-dom";
import { LoginPage } from "@pages/LoginPage";
import { DashboardPage } from "@pages/DashboardPage";
import { AppointmentsPage } from "@pages/AppointmentsPage";
import { DashboardLayout } from "@app/layouts/DashboardLayout";
import { ProtectedRoute } from "./ProtectedRoute";

/**
 * Router Configuration
 *
 * Estructura de rutas:
 * - /login (pública) - Página de inicio de sesión
 * - / (protegida) - Dashboard principal con DashboardLayout
 * - /appointments (protegida) - Gestión de citas
 *
 * Las rutas protegidas requieren autenticación y redirigen a /login
 * si el usuario no está autenticado. Todas las rutas protegidas
 * usan el DashboardLayout con Header y Navbar.
 *
 * Requirements:
 * - 2.1: Rutas protegidas con redirección a login
 * - 2.4: Guard de autenticación
 * - 6.1: Layout principal con AppShell
 * - 6.4: Navegación entre páginas
 *
 * @example
 * ```tsx
 * import { RouterProvider } from 'react-router-dom';
 * import { router } from './app/router/routes';
 *
 * function App() {
 *   return <RouterProvider router={router} />;
 * }
 * ```
 */
export const router = createBrowserRouter([
  // Ruta pública: Login
  {
    path: "/login",
    element: <LoginPage />,
  },

  // Rutas protegidas con DashboardLayout
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          {
            path: "/",
            element: <DashboardPage />,
          },
          {
            path: "/appointments",
            element: <AppointmentsPage />,
          },
          // Aquí se agregarán más rutas protegidas en el futuro:
          // - /offerings
          // - /schedules
          // - /conversations
          // - /settings
        ],
      },
    ],
  },
]);

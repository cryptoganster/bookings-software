/**
 * Router Configuration
 *
 * Define todas las rutas de la aplicación con React Router v6.
 * Incluye rutas públicas y protegidas con DashboardLayout.
 */

import { createBrowserRouter } from "react-router-dom";
import { LoginPage } from "@pages/LoginPage";
import { RegisterPage } from "@pages/RegisterPage";
import { DashboardPage } from "@pages/DashboardPage";
import { AppointmentsPage } from "@pages/AppointmentsPage";
import { CustomersPage } from "@pages/CustomersPage";
import { CustomerDetailPage } from "@pages/CustomerDetailPage";
import { CustomerDuplicatesPage } from "@pages/CustomerDuplicatesPage";
import { OfferingsPage } from "@pages/OfferingsPage";
import { SchedulesPage } from "@pages/SchedulesPage";
import { BlockoutsPage } from "@pages/BlockoutsPage";
import { ConversationsPage } from "@pages/ConversationsPage";
import { DashboardLayout } from "@app/layouts/DashboardLayout";
import { ProtectedRoute } from "./ProtectedRoute";
import { AuthPageGuard } from "./AuthPageGuard";

/**
 * Router Configuration
 *
 * Estructura de rutas:
 * - /login (pública con guard) - Página de inicio de sesión
 * - /register (pública con guard) - Página de registro
 * - / (protegida) - Dashboard principal con DashboardLayout
 * - /appointments (protegida) - Gestión de citas
 * - /customers (protegida) - Gestión de clientes
 * - /customers/:id (protegida) - Detalle de cliente
 * - /customers/duplicates (protegida) - Clientes duplicados
 * - /offerings (protegida) - Gestión de servicios
 * - /schedules (protegida) - Gestión de horarios
 * - /blockouts (protegida) - Gestión de bloqueos
 * - /conversations (protegida) - Consultas de clientes
 *
 * Las rutas protegidas requieren autenticación y redirigen a /login
 * si el usuario no está autenticado. Todas las rutas protegidas
 * usan el DashboardLayout con Header y Navbar.
 *
 * Las rutas de autenticación (/login, /register) redirigen a usuarios
 * autenticados a su dashboard correspondiente según su rol.
 *
 * Requirements:
 * - 2.1: Rutas protegidas con redirección a login
 * - 2.4: Guard de autenticación
 * - FR-4.2: Guard para páginas de auth (usuarios autenticados)
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
  // Rutas de autenticación con AuthPageGuard
  // Redirige usuarios autenticados a su dashboard según rol
  {
    element: <AuthPageGuard />,
    children: [
      {
        path: "/login",
        element: <LoginPage />,
      },
      {
        path: "/register",
        element: <RegisterPage />,
      },
    ],
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
          {
            path: "/customers",
            element: <CustomersPage />,
          },
          {
            path: "/customers/duplicates",
            element: <CustomerDuplicatesPage />,
          },
          {
            path: "/customers/:id",
            element: <CustomerDetailPage />,
          },
          {
            path: "/offerings",
            element: <OfferingsPage />,
          },
          {
            path: "/schedules",
            element: <SchedulesPage />,
          },
          {
            path: "/blockouts",
            element: <BlockoutsPage />,
          },
          {
            path: "/conversations",
            element: <ConversationsPage />,
          },
          // Aquí se agregarán más rutas protegidas en el futuro:
          // - /settings
        ],
      },
    ],
  },
]);

/**
 * Router Configuration
 * 
 * Define todas las rutas de la aplicación con React Router v6.
 * Incluye rutas públicas y protegidas.
 */

import { createBrowserRouter } from 'react-router-dom';
import { LoginPage } from '@pages/LoginPage';
import { DashboardPage } from '@pages/DashboardPage';
import { ProtectedRoute } from './ProtectedRoute';

/**
 * Router Configuration
 * 
 * Estructura de rutas:
 * - /login (pública) - Página de inicio de sesión
 * - / (protegida) - Dashboard principal
 * 
 * Las rutas protegidas requieren autenticación y redirigen a /login
 * si el usuario no está autenticado.
 * 
 * Requirements:
 * - 2.1: Rutas protegidas con redirección a login
 * - 2.4: Guard de autenticación
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
    path: '/login',
    element: <LoginPage />,
  },
  
  // Rutas protegidas
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: '/',
        element: <DashboardPage />,
      },
      // Aquí se agregarán más rutas protegidas en el futuro:
      // - /appointments
      // - /offerings
      // - /schedules
      // - /conversations
      // - /settings
    ],
  },
]);

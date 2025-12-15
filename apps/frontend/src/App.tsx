/**
 * App Component
 * 
 * Componente raíz de la aplicación.
 * Configura el router con rutas públicas y protegidas.
 */

import { RouterProvider } from 'react-router-dom';
import { router } from './app/router';

/**
 * App Root Component
 * 
 * Inicializa el router de la aplicación con todas las rutas configuradas.
 * 
 * Requirements:
 * - 2.1: Sistema de rutas con protección de autenticación
 * 
 * @example
 * ```tsx
 * <AppProviders>
 *   <App />
 * </AppProviders>
 * ```
 */
function App() {
  return <RouterProvider router={router} />;
}

export default App;

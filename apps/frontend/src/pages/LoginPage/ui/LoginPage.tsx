/**
 * LoginPage Component
 * 
 * Página de inicio de sesión del sistema.
 * Integra el LoginForm y maneja la redirección después del login.
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Center, Box } from '@mantine/core';

import { LoginForm } from '@features/auth/login';
import { useAuthStore } from '@app/store/auth.store';

/**
 * Página de Login
 * 
 * Features:
 * - Integra LoginForm con validación y manejo de errores
 * - Redirección automática si el usuario ya está autenticado
 * - Layout centrado y responsive
 * 
 * Requirements:
 * - 2.2: Login con credenciales válidas
 * 
 * @example
 * ```tsx
 * <Route path="/login" element={<LoginPage />} />
 * ```
 */
export function LoginPage() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Redirigir al dashboard si ya está autenticado
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  return (
    <Container size="xs" h="100vh">
      <Center h="100%">
        <Box w="100%">
          <LoginForm />
        </Box>
      </Center>
    </Container>
  );
}

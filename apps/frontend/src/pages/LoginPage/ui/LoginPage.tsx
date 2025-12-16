/**
 * LoginPage Component
 * 
 * Página de inicio de sesión del sistema con layout de dos columnas.
 * Integra el LoginForm y maneja la redirección después del login.
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Grid, Box, BackgroundImage } from '@mantine/core';

import { LoginForm } from '@features/auth/login';
import { useAuthStore } from '@app/store/auth.store';
import loginBackgroundImage from '@/assets/login-background.png';

/**
 * Página de Login con layout de dos columnas
 * 
 * Features:
 * - Layout de dos columnas: formulario (izquierda 50%) + imagen (derecha 50%)
 * - Formulario centrado verticalmente en la columna izquierda
 * - Imagen de fondo que cubre toda la altura en la columna derecha
 * - Responsive: en mobile oculta la imagen y muestra solo el formulario
 * - Redirección automática si el usuario ya está autenticado
 * 
 * Requirements:
 * - 2.2: Login con credenciales válidas
 * - 2.7: Layout de dos columnas (formulario izquierda, imagen derecha)
 * - 2.10: Imagen importada desde assets
 * - 2.13: Responsive en mobile (solo formulario visible)
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
    <Grid h="100vh" m={0}>
      {/* Columna izquierda: Formulario (50%) */}
      <Grid.Col 
        span={{ base: 12, md: 6 }} 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          padding: '2rem'
        }}
      >
        <Box w="100%" style={{ maxWidth: 420 }}>
          <LoginForm />
        </Box>
      </Grid.Col>

      {/* Columna derecha: Imagen de fondo (50%) - Oculta en mobile */}
      <Grid.Col 
        span={{ base: 0, md: 6 }} 
        visibleFrom="md"
        p={0}
      >
        <BackgroundImage
          src={loginBackgroundImage}
          h="100%"
          style={{
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      </Grid.Col>
    </Grid>
  );
}

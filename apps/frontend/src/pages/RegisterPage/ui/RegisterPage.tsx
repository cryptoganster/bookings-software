/**
 * RegisterPage Component
 *
 * Página de registro del sistema con layout de dos columnas.
 * Integra el RegisterForm y maneja la redirección si ya está autenticado.
 *
 * Requirements: FR-1.6, NFR-4.1
 */

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Grid, Box, BackgroundImage } from "@mantine/core";

import { RegisterForm } from "@features/auth/register";
import { useAuthStore } from "@app/store/auth.store";
import loginBackgroundImage from "@/assets/login-background.png";

/**
 * Página de Registro con layout de dos columnas
 *
 * Features:
 * - Layout de dos columnas: formulario (izquierda 50%) + imagen (derecha 50%)
 * - Formulario centrado verticalmente en la columna izquierda
 * - Imagen de fondo que cubre toda la altura en la columna derecha
 * - Responsive: en mobile oculta la imagen y muestra solo el formulario
 * - Redirección automática si el usuario ya está autenticado
 *
 * Requirements:
 * - FR-1.6: Página de registro accesible desde /register
 * - NFR-4.1: Responsive design
 *
 * @example
 * ```tsx
 * <Route path="/register" element={<RegisterPage />} />
 * ```
 */
export function RegisterPage() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Redirigir al dashboard si ya está autenticado
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  return (
    <Box
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        display: "flex",
      }}
    >
      <Grid
        h="100%"
        w="100%"
        m={0}
        gutter={0}
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "row",
        }}
      >
        {/* Columna izquierda: Formulario (50%) */}
        <Grid.Col
          span={{ base: 12, md: 6 }}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
            minHeight: "100vh",
          }}
        >
          <Box w="100%" style={{ maxWidth: 420 }}>
            <RegisterForm />
          </Box>
        </Grid.Col>

        {/* Columna derecha: Imagen de fondo (50%) - Oculta en mobile */}
        <Grid.Col
          span={{ base: 0, md: 6 }}
          visibleFrom="md"
          p={0}
          style={{
            minHeight: "100vh",
            display: "flex",
          }}
        >
          <BackgroundImage
            src={loginBackgroundImage}
            w="100%"
            h="100%"
            style={{
              backgroundSize: "cover",
              backgroundPosition: "center",
              flex: 1,
            }}
          />
        </Grid.Col>
      </Grid>
    </Box>
  );
}

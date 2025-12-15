/**
 * DashboardPage Component
 * 
 * Página principal del dashboard (placeholder para MVP).
 */

import { Container, Title, Text, Stack } from '@mantine/core';
import { useAuthStore } from '@app/store/auth.store';
import { LogoutButton } from '@features/auth/logout';

/**
 * Dashboard Page (Placeholder)
 * 
 * Página principal después del login.
 * Muestra información del usuario autenticado y botón de logout.
 * 
 * Requirements:
 * - 2.2: Acceso al dashboard después de login exitoso
 * 
 * @example
 * ```tsx
 * <Route path="/" element={<DashboardPage />} />
 * ```
 */
export function DashboardPage() {
  const user = useAuthStore((state) => state.user);

  return (
    <Container size="md" py="xl">
      <Stack gap="lg">
        <Title order={1}>Dashboard</Title>
        
        <Text size="lg">
          Bienvenido, {user?.email || 'Usuario'}
        </Text>

        <Text c="dimmed">
          Esta es una página protegida. Solo usuarios autenticados pueden verla.
        </Text>

        <LogoutButton />
      </Stack>
    </Container>
  );
}

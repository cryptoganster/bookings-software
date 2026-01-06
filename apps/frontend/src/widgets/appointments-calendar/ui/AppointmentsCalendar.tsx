/**
 * AppointmentsCalendar Widget
 *
 * Vista de calendario semanal para appointments
 * TODO: Implementar en Task 8
 */

import { Paper, Text, Center } from "@mantine/core";

/**
 * Calendario semanal de appointments
 *
 * Features (TODO):
 * - Vista semanal con 7 días
 * - Navegación entre semanas
 * - Appointments organizados por día y hora
 * - Click en appointment para ver detalles
 * - Integración con filtros
 */
export function AppointmentsCalendar() {
  return (
    <Paper shadow="sm" p="xl" radius="md">
      <Center h={400}>
        <Text size="lg" c="dimmed">
          Vista de calendario - En desarrollo
        </Text>
      </Center>
    </Paper>
  );
}

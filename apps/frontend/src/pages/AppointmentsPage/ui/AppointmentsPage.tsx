/**
 * AppointmentsPage Component
 *
 * Página principal para gestión de citas
 * Muestra lista de appointments con filtros y acciones
 */

import { Container, Stack } from "@mantine/core";
import { PageHeader } from "@shared/ui/PageHeader/PageHeader";
import { AppointmentFilters } from "@features/appointment/filter";
import { AppointmentsList } from "./AppointmentsList";

/**
 * Página de gestión de citas
 *
 * Features:
 * - Filtros por estado y rango de fechas
 * - Lista de citas con información completa
 * - Acciones: cancelar cita
 * - Loading y error states
 * - Empty state cuando no hay citas
 */
export function AppointmentsPage() {
  return (
    <Container fluid py="md">
      <Stack gap="lg">
        <PageHeader title="Gestión de Citas" />

        <AppointmentFilters />

        <AppointmentsList />
      </Stack>
    </Container>
  );
}

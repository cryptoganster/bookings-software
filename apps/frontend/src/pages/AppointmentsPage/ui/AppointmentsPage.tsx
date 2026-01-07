/**
 * AppointmentsPage Component
 *
 * Página principal para gestión de citas
 * Muestra lista o calendario de appointments con filtros y acciones
 */

import { lazy, Suspense } from "react";
import { Container, Stack, Group } from "@mantine/core";
import { PageHeader } from "@shared/ui/PageHeader/PageHeader";
import { AppointmentFilters } from "@features/appointment/filter";
import {
  ViewToggle,
  useViewPreference,
} from "@features/appointment/view-toggle";
import { LoadingOverlay } from "@shared/ui/LoadingOverlay/LoadingOverlay";
import { AppointmentsList } from "./AppointmentsList";

// Lazy load calendar view para code splitting
const AppointmentsCalendar = lazy(() =>
  import("@widgets/appointments-calendar").then((m) => ({
    default: m.AppointmentsCalendar,
  })),
);

/**
 * Página de gestión de citas
 *
 * Features:
 * - Toggle entre vista de lista y calendario
 * - Filtros por estado y rango de fechas
 * - Lista de citas con información completa
 * - Vista de calendario semanal
 * - Acciones: cancelar cita
 * - Loading y error states
 * - Empty state cuando no hay citas
 * - Code splitting para optimizar bundle size
 */
export function AppointmentsPage() {
  const { view } = useViewPreference();

  return (
    <Container fluid py="md">
      <Stack gap="lg">
        {/* Header con título y toggle de vista */}
        <Group justify="space-between" align="center">
          <PageHeader title="Gestión de Citas" />
          <ViewToggle />
        </Group>

        {/* Filtros (compartidos entre ambas vistas) */}
        <AppointmentFilters />

        {/* Renderizado condicional según vista seleccionada */}
        {view === "list" ? (
          <AppointmentsList />
        ) : (
          <Suspense fallback={<LoadingOverlay visible />}>
            <AppointmentsCalendar />
          </Suspense>
        )}
      </Stack>
    </Container>
  );
}

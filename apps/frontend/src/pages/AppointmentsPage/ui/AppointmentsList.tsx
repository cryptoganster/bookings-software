/**
 * AppointmentsList Component
 *
 * Lista de appointments con filtros aplicados
 * Muestra cards de appointments con acciones
 */

import { Alert, SimpleGrid } from "@mantine/core";
import { IconInfoCircle } from "@tabler/icons-react";
import { useAppointments } from "@entities/appointment";
import { AppointmentCard } from "@entities/appointment";
import { CancelAppointmentButton } from "@features/appointment/cancel";
import { useAppointmentFilters } from "@features/appointment/filter";
import { LoadingOverlay } from "@shared/ui/LoadingOverlay/LoadingOverlay";
import { EmptyState } from "@shared/ui/EmptyState/EmptyState";

/**
 * Lista de appointments con filtros aplicados
 *
 * Features:
 * - Integración con filtros de Zustand
 * - Loading state durante fetch
 * - Error state con mensaje
 * - Empty state cuando no hay resultados
 * - Grid responsive de cards
 * - Botón de cancelación por appointment
 */
export function AppointmentsList() {
  // Obtener filtros del store
  const { status, dateRange, offeringId } = useAppointmentFilters();

  // Construir objeto de filtros para la query
  const filters = {
    status: status || undefined,
    dateRange: dateRange || undefined,
    offeringId: offeringId || undefined,
  };

  // Fetch appointments con filtros
  const { data: appointments, isLoading, isError, error } = useAppointments(filters);

  // Loading state
  if (isLoading) {
    return <LoadingOverlay visible />;
  }

  // Error state
  if (isError) {
    return (
      <Alert
        icon={<IconInfoCircle size={16} />}
        title="Error al cargar citas"
        color="red"
      >
        {error?.message || "No se pudieron cargar las citas. Por favor, intenta de nuevo."}
      </Alert>
    );
  }

  // Empty state
  if (!appointments || appointments.length === 0) {
    const hasFilters = status || dateRange || offeringId;
    return (
      <EmptyState
        message={
          hasFilters
            ? "No se encontraron citas con los filtros aplicados"
            : "No hay citas programadas"
        }
      />
    );
  }

  // Lista de appointments
  return (
    <SimpleGrid
      cols={{ base: 1, sm: 2, lg: 3 }}
      spacing="lg"
    >
      {appointments.map((appointment) => (
        <AppointmentCard
          key={appointment.id}
          appointment={appointment}
          actions={
            appointment.status === "CONFIRMED" && (
              <CancelAppointmentButton
                appointmentId={appointment.id}
                size="xs"
                variant="subtle"
              />
            )
          }
        />
      ))}
    </SimpleGrid>
  );
}

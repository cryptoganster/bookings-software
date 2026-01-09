/**
 * AppointmentDetailsModal Component
 *
 * Modal que muestra los detalles completos de una cita.
 *
 * Características:
 * - Carga datos solo cuando el modal está abierto (enabled: opened)
 * - Muestra LoadingOverlay mientras carga
 * - Muestra mensaje de error si falla la carga
 * - Muestra todos los detalles de la cita
 * - Incluye botón de cancelar solo para citas CONFIRMED
 * - Cierra el modal después de cancelar exitosamente
 * - Todas las fechas se muestran en la zona horaria del negocio
 *
 * Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 9.1, 9.2
 */

import {
  Modal,
  Stack,
  Text,
  Group,
  Badge,
  LoadingOverlay,
} from "@mantine/core";
import {
  useAppointment,
  getStatusColor,
  formatAppointmentDateTime,
} from "@entities/appointment";
import { CancelAppointmentButton } from "@features/appointment/cancel";
import { useAuthStore } from "@app/store/auth.store";

interface AppointmentDetailsModalProps {
  /**
   * ID de la cita a mostrar
   */
  appointmentId: string;
  /**
   * Controla si el modal está abierto
   */
  opened: boolean;
  /**
   * Callback para cerrar el modal
   */
  onClose: () => void;
}

/**
 * Modal de detalles de cita
 *
 * @example
 * ```tsx
 * const [opened, setOpened] = useState(false);
 *
 * <AppointmentDetailsModal
 *   appointmentId="appointment-id"
 *   opened={opened}
 *   onClose={() => setOpened(false)}
 * />
 * ```
 */
export function AppointmentDetailsModal({
  appointmentId,
  opened,
  onClose,
}: AppointmentDetailsModalProps) {
  const businessTimezone = useAuthStore((state) => state.businessTimezone);

  // Solo cargar datos cuando el modal está abierto
  const {
    data: appointment,
    isLoading,
    isError,
  } = useAppointment(appointmentId, {
    enabled: opened,
  });

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Detalles de la Cita"
      size="md"
      centered
    >
      {/* Loading overlay mientras carga */}
      <LoadingOverlay visible={isLoading} />

      {/* Mensaje de error si falla la carga */}
      {isError && (
        <Text c="red" size="sm">
          Error al cargar los detalles de la cita. Por favor, intenta de nuevo.
        </Text>
      )}

      {/* Contenido del modal cuando hay datos */}
      {appointment && (
        <Stack gap="md">
          {/* Header: Offering name y status badge */}
          <Group justify="space-between" align="flex-start">
            <Text size="xl" fw={600}>
              {appointment.offeringName}
            </Text>
            <Badge color={getStatusColor(appointment.status)} size="lg">
              {appointment.status}
            </Badge>
          </Group>

          {/* Detalles de la cita */}
          <Stack gap="xs">
            <Group>
              <Text size="sm" fw={500} c="dimmed" style={{ minWidth: "100px" }}>
                Cliente:
              </Text>
              <Text size="sm">{appointment.customerName}</Text>
            </Group>

            <Group>
              <Text size="sm" fw={500} c="dimmed" style={{ minWidth: "100px" }}>
                Teléfono:
              </Text>
              <Text size="sm">{appointment.customerPhone}</Text>
            </Group>

            <Group>
              <Text size="sm" fw={500} c="dimmed" style={{ minWidth: "100px" }}>
                Fecha y Hora:
              </Text>
              <Text size="sm">
                {formatAppointmentDateTime(
                  appointment.dateTime,
                  businessTimezone || undefined,
                )}
              </Text>
            </Group>

            <Group>
              <Text size="sm" fw={500} c="dimmed" style={{ minWidth: "100px" }}>
                Creada:
              </Text>
              <Text size="sm">
                {formatAppointmentDateTime(
                  appointment.createdAt,
                  businessTimezone || undefined,
                )}
              </Text>
            </Group>
          </Stack>

          {/* Botón de cancelar solo para citas CONFIRMED */}
          {appointment.status === "CONFIRMED" && (
            <Group justify="flex-end" mt="md">
              <CancelAppointmentButton
                appointmentId={appointment.id}
                onSuccess={onClose}
                variant="filled"
              />
            </Group>
          )}
        </Stack>
      )}
    </Modal>
  );
}

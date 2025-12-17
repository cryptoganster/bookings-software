/**
 * CancelAppointmentButton Component
 *
 * Botón para cancelar una cita con modal de confirmación.
 *
 * Características:
 * - Modal de confirmación antes de cancelar
 * - Loading state durante la cancelación
 * - Notificaciones automáticas de éxito/error (via useCancelAppointment)
 * - Optimistic update (via useCancelAppointment)
 *
 * Validates: Requirements 4.3, 4.4
 */

import { Button, Modal, Text, Group, Stack } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconX, IconAlertCircle } from "@tabler/icons-react";
import { useCancelAppointment } from "../model/useCancelAppointment";

interface CancelAppointmentButtonProps {
  appointmentId: string;
  /**
   * Callback opcional que se ejecuta después de cancelar exitosamente
   */
  onSuccess?: () => void;
  /**
   * Variante del botón
   * @default "subtle"
   */
  variant?: "filled" | "light" | "outline" | "subtle" | "default";
  /**
   * Tamaño del botón
   * @default "sm"
   */
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  /**
   * Texto del botón
   * @default "Cancelar Cita"
   */
  children?: React.ReactNode;
}

/**
 * Botón para cancelar una cita con confirmación
 *
 * @example
 * ```tsx
 * <CancelAppointmentButton
 *   appointmentId={appointment.id}
 *   onSuccess={() => navigate('/appointments')}
 * />
 * ```
 *
 * @example Con personalización
 * ```tsx
 * <CancelAppointmentButton
 *   appointmentId={appointment.id}
 *   variant="filled"
 *   size="md"
 * >
 *   Cancelar esta cita
 * </CancelAppointmentButton>
 * ```
 */
export function CancelAppointmentButton({
  appointmentId,
  onSuccess,
  variant = "subtle",
  size = "sm",
  children = "Cancelar Cita",
}: CancelAppointmentButtonProps) {
  const [opened, { open, close }] = useDisclosure(false);
  const { mutate: cancelAppointment, isPending } = useCancelAppointment();

  const handleConfirmCancel = () => {
    cancelAppointment(appointmentId, {
      onSuccess: () => {
        close();
        onSuccess?.();
      },
    });
  };

  return (
    <>
      {/* Botón principal */}
      <Button
        variant={variant}
        size={size}
        color="red"
        leftSection={<IconX size={16} />}
        onClick={open}
      >
        {children}
      </Button>

      {/* Modal de confirmación */}
      <Modal
        opened={opened}
        onClose={close}
        title="Confirmar Cancelación"
        centered
        size="md"
      >
        <Stack gap="md">
          {/* Mensaje de advertencia */}
          <Group gap="sm" align="flex-start">
            <IconAlertCircle
              size={24}
              color="var(--mantine-color-red-6)"
              style={{ flexShrink: 0 }}
            />
            <div>
              <Text size="sm" fw={500} mb={4}>
                ¿Estás seguro que deseas cancelar esta cita?
              </Text>
              <Text size="sm" c="dimmed">
                Esta acción no se puede deshacer. El cliente será notificado de
                la cancelación.
              </Text>
            </div>
          </Group>

          {/* Botones de acción */}
          <Group justify="flex-end" mt="md">
            <Button variant="subtle" onClick={close} disabled={isPending}>
              No, mantener cita
            </Button>
            <Button
              color="red"
              onClick={handleConfirmCancel}
              loading={isPending}
              leftSection={!isPending ? <IconX size={16} /> : undefined}
            >
              Sí, cancelar cita
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}

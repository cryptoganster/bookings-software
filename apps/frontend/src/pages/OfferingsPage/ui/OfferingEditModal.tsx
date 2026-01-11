/**
 * OfferingEditModal Component
 *
 * Modal for editing existing offerings.
 *
 * Features:
 * - Integrates OfferingForm component with preloaded data
 * - Success/error notifications
 * - Automatic modal close on success
 * - Query cache update
 * - Accessibility (ARIA attributes, focus management)
 */

import { Modal } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useUpdateOffering, type OfferingFormData } from "@entities/offering";
import type { OfferingDto } from "@packages/shared-types";
import { OfferingForm } from "./OfferingForm";

/**
 * Props for OfferingEditModal component
 */
export interface OfferingEditModalProps {
  /** Whether the modal is open */
  opened: boolean;
  /** Handler to close the modal */
  onClose: () => void;
  /** Offering to edit */
  offering: OfferingDto;
}

/**
 * OfferingEditModal Component
 *
 * Modal para editar offerings existentes.
 * Valida Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6
 */
export function OfferingEditModal({
  opened,
  onClose,
  offering,
}: OfferingEditModalProps) {
  const updateOffering = useUpdateOffering();

  /**
   * Handle form submission
   * Requirements: 2.3, 6.2
   */
  const handleSubmit = async (data: OfferingFormData) => {
    try {
      // Actualizar offering con los datos del formulario
      await updateOffering.mutateAsync({
        id: offering.id,
        dto: {
          name: data.name,
          duration: data.durationMinutes,
          maxCapacityPerSlot: data.maxCapacityPerSlot,
          maxDailyCapacity: data.maxDailyCapacity ?? undefined,
        },
      });

      // Mostrar notificación de éxito
      // Requirements: 2.4, 4.2, 4.6
      notifications.show({
        title: "Éxito",
        message: "Servicio actualizado exitosamente",
        color: "green",
        autoClose: 3000,
      });

      // Cerrar modal automáticamente
      // Requirements: 2.4, 4.6
      onClose();
    } catch (error: unknown) {
      // Mantener modal abierto en caso de error
      // Requirements: 2.5, 4.5, 4.7

      // Determinar mensaje de error específico
      // Requirements: 6.6, 6.7
      let errorMessage = "Ocurrió un error inesperado";

      // Type guard para errores de API
      const apiError = error as {
        response?: { status?: number; data?: { message?: string } };
        message?: string;
      };

      if (apiError?.response?.status === 409) {
        errorMessage = "Ya existe un servicio con ese nombre";
      } else if (apiError?.response?.status === 403) {
        errorMessage = "No tienes permisos para realizar esta acción";
      } else if (apiError?.response?.status === 404) {
        errorMessage = "El servicio no fue encontrado";
      } else if (apiError?.response?.data?.message) {
        errorMessage = apiError.response.data.message;
      } else if (apiError?.message) {
        errorMessage = apiError.message;
      }

      // Mostrar notificación de error
      // Requirements: 4.5, 4.7
      notifications.show({
        title: "Error",
        message: errorMessage,
        color: "red",
        autoClose: 5000,
      });
    }
  };

  /**
   * Handle cancel
   * Requirements: 2.6
   */
  const handleCancel = () => {
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Editar Servicio"
      size="md"
      centered
      closeOnClickOutside={!updateOffering.isPending}
      closeOnEscape={!updateOffering.isPending}
      withCloseButton={!updateOffering.isPending}
      // Accessibility attributes
      // Requirements: 7.1, 7.2, 7.3, 7.4
      trapFocus
      returnFocus
      // Responsive behavior
      // Requirements: 8.1, 8.2, 8.3
      fullScreen
    >
      <OfferingForm
        offering={offering}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={updateOffering.isPending}
      />
    </Modal>
  );
}

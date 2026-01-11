/**
 * OfferingCreateModal Component
 *
 * Modal for creating new offerings.
 *
 * Features:
 * - Integrates OfferingForm component
 * - Success/error notifications
 * - Automatic modal close on success
 * - Query invalidation
 * - Accessibility (ARIA attributes, focus management)
 */

import { Modal } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useCreateOffering, type OfferingFormData } from "@entities/offering";
import { OfferingForm } from "./OfferingForm";

/**
 * Props for OfferingCreateModal component
 */
export interface OfferingCreateModalProps {
  /** Whether the modal is open */
  opened: boolean;
  /** Handler to close the modal */
  onClose: () => void;
}

/**
 * OfferingCreateModal Component
 *
 * Modal para crear nuevos offerings.
 * Valida Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6
 */
export function OfferingCreateModal({
  opened,
  onClose,
}: OfferingCreateModalProps) {
  const createOffering = useCreateOffering();

  /**
   * Handle form submission
   * Requirements: 1.4, 6.1
   */
  const handleSubmit = async (data: OfferingFormData) => {
    try {
      // Crear offering con los datos del formulario
      await createOffering.mutateAsync({
        name: data.name,
        duration: data.durationMinutes, // El formulario usa durationMinutes internamente, pero la API espera duration
        maxCapacityPerSlot: data.maxCapacityPerSlot,
        maxDailyCapacity: data.maxDailyCapacity ?? undefined,
      });

      // Mostrar notificación de éxito
      // Requirements: 1.5, 4.1, 4.6
      notifications.show({
        title: "Éxito",
        message: "Servicio creado exitosamente",
        color: "green",
        autoClose: 3000,
      });

      // Cerrar modal automáticamente
      // Requirements: 1.5, 4.6
      onClose();
    } catch (error: unknown) {
      // Mantener modal abierto en caso de error
      // Requirements: 1.6, 4.5, 4.7

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
   * Requirements: 1.3
   */
  const handleCancel = () => {
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Crear Servicio"
      size="md"
      centered
      closeOnClickOutside={!createOffering.isPending}
      closeOnEscape={!createOffering.isPending}
      withCloseButton={!createOffering.isPending}
      // Accessibility attributes
      // Requirements: 7.1, 7.2, 7.3, 7.4
      trapFocus
      returnFocus
    >
      <OfferingForm
        offering={null}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={createOffering.isPending}
      />
    </Modal>
  );
}

/**
 * DeleteCustomerModal Component
 *
 * Modal for deleting (anonymizing) a customer with GDPR compliance.
 * Shows clear warning about data anonymization and consequences.
 *
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5
 */

import { Modal, Stack, Group, Button, Text, Alert, List } from "@mantine/core";
import { IconAlertTriangle, IconTrash } from "@tabler/icons-react";
import type { CustomerReadModel } from "@packages/shared-types";
import { useDeleteCustomer } from "../model/useDeleteCustomer";
import { formatCustomerName } from "@shared/lib/customer/formatters";

interface DeleteCustomerModalProps {
  opened: boolean;
  onClose: () => void;
  customer: CustomerReadModel | null;
  onSuccess?: () => void;
}

/**
 * Modal for deleting (anonymizing) a customer
 *
 * Features:
 * - GDPR compliance warning
 * - Clear explanation of anonymization
 * - Confirmation before deletion
 * - Loading state during operation
 * - Success/error notifications
 *
 * Requirements:
 * - 10.1: Clear GDPR warning
 * - 10.2: Explanation of data anonymization
 * - 10.3: Confirmation before deletion
 * - 10.4: Loading state during operation
 * - 10.5: Success/error feedback
 *
 * @example
 * ```tsx
 * <DeleteCustomerModal
 *   opened={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   customer={customer}
 *   onSuccess={() => navigate('/customers')}
 * />
 * ```
 */
export function DeleteCustomerModal({
  opened,
  onClose,
  customer,
  onSuccess,
}: DeleteCustomerModalProps) {
  const { mutate: deleteCustomer, isPending } = useDeleteCustomer();

  const handleDelete = () => {
    if (!customer) return;

    deleteCustomer(
      { customerId: customer.id },
      {
        onSuccess: () => {
          onClose();
          onSuccess?.();
        },
      },
    );
  };

  const canDelete = customer && !isPending;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Eliminar Cliente (GDPR)"
      size="lg"
      closeOnClickOutside={!isPending}
      closeOnEscape={!isPending}
    >
      <Stack gap="lg">
        {/* GDPR Warning Alert */}
        <Alert
          icon={<IconAlertTriangle size={16} />}
          title="Acción irreversible - Cumplimiento GDPR"
          color="red"
          variant="light"
        >
          <Stack gap="xs">
            <Text size="sm" fw={500}>
              Esta acción anonimizará permanentemente los datos del cliente
              según las regulaciones GDPR.
            </Text>
            <Text size="sm">
              {customer && (
                <>
                  Cliente: <strong>{formatCustomerName(customer)}</strong>
                </>
              )}
            </Text>
          </Stack>
        </Alert>

        {/* Explanation */}
        <Stack gap="sm">
          <Text size="sm" fw={500}>
            ¿Qué sucederá con los datos?
          </Text>

          <List size="sm" spacing="xs">
            <List.Item>El nombre del cliente será eliminado</List.Item>
            <List.Item>El número de WhatsApp será anonimizado</List.Item>
            <List.Item>
              Si está vinculado a un usuario, se desvinculará
            </List.Item>
            <List.Item>
              El historial de citas se mantendrá pero sin datos personales
            </List.Item>
            <List.Item>Esta acción NO se puede deshacer</List.Item>
          </List>
        </Stack>

        {/* Validation */}
        {customer?.appointmentCount && customer.appointmentCount > 0 && (
          <Alert color="blue" variant="light">
            <Text size="sm">
              Este cliente tiene {customer.appointmentCount}{" "}
              {customer.appointmentCount === 1 ? "cita" : "citas"} registradas.
              Los datos de las citas se mantendrán pero sin información personal
              del cliente.
            </Text>
          </Alert>
        )}

        {/* Action Buttons */}
        <Group justify="flex-end" gap="sm">
          <Button variant="subtle" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>

          <Button
            color="red"
            leftSection={<IconTrash size={16} />}
            onClick={handleDelete}
            disabled={!canDelete}
            loading={isPending}
          >
            Confirmar Eliminación
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}

/**
 * MergeCustomersModal Component
 *
 * Modal for merging two customers with preview and confirmation.
 * Shows side-by-side comparison and explains the merge operation.
 *
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5
 */

import { Modal, Stack, Group, Button, Text, Alert, Grid } from "@mantine/core";
import { IconAlertTriangle, IconGitMerge } from "@tabler/icons-react";
import type { CustomerReadModel } from "@packages/shared-types";
import { CustomerComparisonCard } from "./CustomerComparisonCard";
import { useMergeCustomers } from "../model/useMergeCustomers";

interface MergeCustomersModalProps {
  opened: boolean;
  onClose: () => void;
  sourceCustomer: CustomerReadModel | null;
  targetCustomer: CustomerReadModel | null;
  onSuccess?: () => void;
}

/**
 * Modal for merging customers
 *
 * Features:
 * - Side-by-side customer comparison
 * - Clear explanation of merge operation
 * - Warning about irreversible action
 * - Loading state during merge
 * - Success/error notifications
 *
 * Requirements:
 * - 10.1: Merge preview with customer comparison
 * - 10.2: Clear explanation of merge consequences
 * - 10.3: Confirmation before merge
 * - 10.4: Loading state during operation
 * - 10.5: Success/error feedback
 *
 * @example
 * ```tsx
 * <MergeCustomersModal
 *   opened={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   sourceCustomer={customer1}
 *   targetCustomer={customer2}
 *   onSuccess={() => navigate('/customers')}
 * />
 * ```
 */
export function MergeCustomersModal({
  opened,
  onClose,
  sourceCustomer,
  targetCustomer,
  onSuccess,
}: MergeCustomersModalProps) {
  const { mutate: mergeCustomers, isPending } = useMergeCustomers();

  const handleMerge = () => {
    if (!sourceCustomer || !targetCustomer) return;

    mergeCustomers(
      {
        sourceCustomerId: sourceCustomer.id,
        targetCustomerId: targetCustomer.id,
      },
      {
        onSuccess: () => {
          onClose();
          onSuccess?.();
        },
      },
    );
  };

  const canMerge = sourceCustomer && targetCustomer && !isPending;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Fusionar Clientes"
      size="xl"
      closeOnClickOutside={!isPending}
      closeOnEscape={!isPending}
    >
      <Stack gap="lg">
        {/* Warning Alert */}
        <Alert
          icon={<IconAlertTriangle size={16} />}
          title="Acción irreversible"
          color="yellow"
          variant="light"
        >
          <Stack gap="xs">
            <Text size="sm">
              Esta acción no se puede deshacer. El cliente de origen será
              fusionado con el cliente destino:
            </Text>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              <li>
                <Text size="sm">
                  Todas las citas del cliente de origen se transferirán al
                  cliente destino
                </Text>
              </li>
              <li>
                <Text size="sm">
                  Todas las conversaciones del cliente de origen se transferirán
                  al cliente destino
                </Text>
              </li>
              <li>
                <Text size="sm">
                  El cliente de origen será marcado como fusionado y no podrá
                  ser utilizado
                </Text>
              </li>
            </ul>
          </Stack>
        </Alert>

        {/* Customer Comparison */}
        <Grid gutter="md">
          <Grid.Col span={6}>
            {sourceCustomer ? (
              <CustomerComparisonCard
                customer={sourceCustomer}
                label="Cliente a fusionar (origen)"
                color="red"
              />
            ) : (
              <Text c="dimmed">Selecciona un cliente de origen</Text>
            )}
          </Grid.Col>

          <Grid.Col span={6}>
            {targetCustomer ? (
              <CustomerComparisonCard
                customer={targetCustomer}
                label="Cliente destino (mantener)"
                color="green"
              />
            ) : (
              <Text c="dimmed">Selecciona un cliente destino</Text>
            )}
          </Grid.Col>
        </Grid>

        {/* Action Buttons */}
        <Group justify="flex-end" gap="sm">
          <Button variant="subtle" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>

          <Button
            color="red"
            leftSection={<IconGitMerge size={16} />}
            onClick={handleMerge}
            disabled={!canMerge}
            loading={isPending}
          >
            Fusionar Clientes
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}

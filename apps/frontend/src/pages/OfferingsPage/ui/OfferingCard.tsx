/**
 * OfferingCard Component
 *
 * Memoized card component for displaying offering information.
 * Uses React.memo to prevent unnecessary re-renders when parent updates.
 *
 * Requirements: Performance optimization
 */

import { memo } from "react";
import {
  Card,
  Stack,
  Group,
  Text,
  Badge,
  ActionIcon,
  Menu,
} from "@mantine/core";
import {
  IconDots,
  IconEdit,
  IconTrash,
  IconCheck,
  IconX,
} from "@tabler/icons-react";
import type { OfferingDto } from "@packages/shared-types";

/**
 * Props for OfferingCard component
 */
export interface OfferingCardProps {
  /** Offering data to display */
  offering: OfferingDto;
  /** Handler for edit action */
  onEdit: (offering: OfferingDto) => void;
  /** Handler for delete action */
  onDelete: (id: string) => void;
  /** Handler for toggle active status */
  onToggleActive: (id: string, currentStatus: boolean) => void;
}

/**
 * OfferingCard Component
 *
 * Displays offering information in a card format with action menu.
 * Memoized to prevent unnecessary re-renders.
 */
function OfferingCardComponent({
  offering,
  onEdit,
  onDelete,
  onToggleActive,
}: OfferingCardProps) {
  return (
    <Card withBorder shadow="sm" radius="xl" p="lg">
      <Stack gap="md">
        <Group justify="space-between">
          <Text fw={600} size="lg">
            {offering.name}
          </Text>
          <Menu shadow="md" width={200}>
            <Menu.Target>
              <ActionIcon
                variant="subtle"
                color="gray"
                aria-label={`Acciones para ${offering.name}`}
              >
                <IconDots size={16} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item
                leftSection={<IconEdit size={14} />}
                onClick={() => onEdit(offering)}
                aria-label={`Editar ${offering.name}`}
              >
                Editar
              </Menu.Item>
              <Menu.Item
                leftSection={
                  offering.isActive ? (
                    <IconX size={14} />
                  ) : (
                    <IconCheck size={14} />
                  )
                }
                onClick={() => onToggleActive(offering.id, offering.isActive)}
                aria-label={
                  offering.isActive
                    ? `Desactivar ${offering.name}`
                    : `Activar ${offering.name}`
                }
              >
                {offering.isActive ? "Desactivar" : "Activar"}
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item
                color="red"
                leftSection={<IconTrash size={14} />}
                onClick={() => onDelete(offering.id)}
                aria-label={`Eliminar ${offering.name}`}
              >
                Eliminar
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>

        <Stack gap="xs">
          <Group gap="xs">
            <Text size="sm" c="dimmed">
              Duración:
            </Text>
            <Text size="sm" fw={500}>
              {offering.duration} min
            </Text>
          </Group>

          <Group gap="xs">
            <Text size="sm" c="dimmed">
              Capacidad:
            </Text>
            <Text size="sm" fw={500}>
              {offering.maxCapacityPerSlot} por slot
            </Text>
          </Group>

          {offering.maxDailyCapacity && (
            <Group gap="xs">
              <Text size="sm" c="dimmed">
                Máx. diario:
              </Text>
              <Text size="sm" fw={500}>
                {offering.maxDailyCapacity}
              </Text>
            </Group>
          )}

          <Badge
            color={offering.isActive ? "green" : "gray"}
            variant="light"
            size="sm"
          >
            {offering.isActive ? "Activo" : "Inactivo"}
          </Badge>
        </Stack>
      </Stack>
    </Card>
  );
}

/**
 * Memoized OfferingCard
 *
 * Uses React.memo to prevent re-renders when props haven't changed.
 * Custom comparison function checks offering ID and relevant properties.
 */
export const OfferingCard = memo(
  OfferingCardComponent,
  (prevProps, nextProps) => {
    // Compare offering properties that affect rendering
    const prevOffering = prevProps.offering;
    const nextOffering = nextProps.offering;

    return (
      prevOffering.id === nextOffering.id &&
      prevOffering.name === nextOffering.name &&
      prevOffering.duration === nextOffering.duration &&
      prevOffering.maxCapacityPerSlot === nextOffering.maxCapacityPerSlot &&
      prevOffering.maxDailyCapacity === nextOffering.maxDailyCapacity &&
      prevOffering.isActive === nextOffering.isActive &&
      prevProps.onEdit === nextProps.onEdit &&
      prevProps.onDelete === nextProps.onDelete &&
      prevProps.onToggleActive === nextProps.onToggleActive
    );
  },
);

OfferingCard.displayName = "OfferingCard";

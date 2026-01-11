/**
 * OfferingsPage Component
 *
 * Main offerings management page that displays:
 * - List of offerings (services)
 * - Create/Edit/Delete actions
 * - Active/Inactive toggle
 *
 * Uses TanStack Query for server state management.
 */

import { useState } from "react";
import {
  Container,
  Stack,
  Grid,
  Button,
  Center,
  Text,
  Loader,
  Alert,
  Group,
  Badge,
  Card,
  ActionIcon,
  Menu,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconAlertCircle,
  IconPlus,
  IconDots,
  IconEdit,
  IconTrash,
  IconCheck,
  IconX,
} from "@tabler/icons-react";
import { PageHeader } from "@shared/ui/PageHeader/PageHeader";
import {
  useOfferings,
  useDeleteOffering,
  useToggleOfferingActive,
} from "@entities/offering";
import type { OfferingDto } from "@packages/shared-types";
import { OfferingCreateModal } from "./OfferingCreateModal";
import { OfferingEditModal } from "./OfferingEditModal";

export function OfferingsPage() {
  // Estado para modales
  // Requirements: 1.1, 2.1
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedOffering, setSelectedOffering] = useState<OfferingDto | null>(
    null,
  );

  const { data: offerings, isLoading, isError, error } = useOfferings();
  const deleteOffering = useDeleteOffering();
  const toggleActive = useToggleOfferingActive();

  /**
   * Abrir modal de creación
   * Requirements: 1.1
   */
  const handleOpenCreateModal = () => {
    setIsCreateModalOpen(true);
  };

  /**
   * Cerrar modal de creación
   * Requirements: 1.3
   */
  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
  };

  /**
   * Abrir modal de edición
   * Requirements: 2.1
   */
  const handleOpenEditModal = (offering: OfferingDto) => {
    setSelectedOffering(offering);
    setIsEditModalOpen(true);
  };

  /**
   * Cerrar modal de edición
   * Requirements: 2.6
   */
  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedOffering(null);
  };

  /**
   * Eliminar offering con confirmación
   * Requirements: 5.3
   */
  const handleDelete = async (id: string) => {
    // Mostrar diálogo de confirmación con mensaje claro
    const confirmed = window.confirm(
      "¿Estás seguro de que deseas eliminar este servicio? Esta acción no se puede deshacer.",
    );

    if (confirmed) {
      try {
        await deleteOffering.mutateAsync(id);
        // Mostrar notificación de éxito
        // Requirements: 4.3, 4.6
        notifications.show({
          title: "Éxito",
          message: "Servicio eliminado exitosamente",
          color: "green",
          autoClose: 3000,
        });
      } catch (error: unknown) {
        // Mostrar notificación de error
        // Requirements: 4.5, 4.7
        let errorMessage = "Ocurrió un error al eliminar el servicio";

        const apiError = error as {
          response?: { status?: number; data?: { message?: string } };
          message?: string;
        };

        if (apiError?.response?.status === 403) {
          errorMessage = "No tienes permisos para realizar esta acción";
        } else if (apiError?.response?.status === 404) {
          errorMessage = "El servicio no fue encontrado";
        } else if (apiError?.response?.data?.message) {
          errorMessage = apiError.response.data.message;
        } else if (apiError?.message) {
          errorMessage = apiError.message;
        }

        notifications.show({
          title: "Error",
          message: errorMessage,
          color: "red",
          autoClose: 5000,
        });
      }
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await toggleActive.mutateAsync({ id, isActive: !currentStatus });
      // Mostrar notificación de éxito
      // Requirements: 4.4, 4.6
      notifications.show({
        title: "Éxito",
        message: `Servicio ${currentStatus ? "desactivado" : "activado"} exitosamente`,
        color: "green",
        autoClose: 3000,
      });
    } catch (error: unknown) {
      // Mostrar notificación de error
      // Requirements: 4.5, 4.7
      let errorMessage = "Ocurrió un error al cambiar el estado del servicio";

      const apiError = error as {
        response?: { status?: number; data?: { message?: string } };
        message?: string;
      };

      if (apiError?.response?.status === 403) {
        errorMessage = "No tienes permisos para realizar esta acción";
      } else if (apiError?.response?.status === 404) {
        errorMessage = "El servicio no fue encontrado";
      } else if (apiError?.response?.data?.message) {
        errorMessage = apiError.response.data.message;
      } else if (apiError?.message) {
        errorMessage = apiError.message;
      }

      notifications.show({
        title: "Error",
        message: errorMessage,
        color: "red",
        autoClose: 5000,
      });
    }
  };

  return (
    <Container fluid py="md">
      <Stack gap="lg">
        <Group justify="space-between">
          <PageHeader title="Servicios" />
          <Button
            leftSection={<IconPlus size={16} />}
            radius="xl"
            onClick={handleOpenCreateModal}
            aria-label="Crear nuevo servicio"
          >
            Nuevo Servicio
          </Button>
        </Group>

        {/* Loading State */}
        {isLoading && (
          <Center py="xl">
            <Loader size="lg" />
          </Center>
        )}

        {/* Error State */}
        {isError && (
          <Alert
            icon={<IconAlertCircle size={16} />}
            title="Error al cargar servicios"
            color="red"
            variant="light"
          >
            {error instanceof Error
              ? error.message
              : "Ocurrió un error inesperado"}
          </Alert>
        )}

        {/* Empty State */}
        {!isLoading && !isError && offerings && offerings.length === 0 && (
          <Center py="xl">
            <Stack align="center" gap="xs">
              <Text size="lg" c="dimmed">
                No hay servicios configurados
              </Text>
              <Text size="sm" c="dimmed">
                Crea tu primer servicio para comenzar
              </Text>
            </Stack>
          </Center>
        )}

        {/* Offerings Grid */}
        {!isLoading && !isError && offerings && offerings.length > 0 && (
          <Grid gutter="md">
            {offerings.map((offering) => (
              <Grid.Col
                key={offering.id}
                span={{ base: 12, sm: 6, md: 4, lg: 3 }}
              >
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
                            onClick={() => handleOpenEditModal(offering)}
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
                            onClick={() =>
                              handleToggleActive(offering.id, offering.isActive)
                            }
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
                            onClick={() => handleDelete(offering.id)}
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
              </Grid.Col>
            ))}
          </Grid>
        )}
      </Stack>

      {/* Modal de creación */}
      {/* Requirements: 1.1 */}
      <OfferingCreateModal
        opened={isCreateModalOpen}
        onClose={handleCloseCreateModal}
      />

      {/* Modal de edición */}
      {/* Requirements: 2.1 */}
      {selectedOffering && (
        <OfferingEditModal
          opened={isEditModalOpen}
          onClose={handleCloseEditModal}
          offering={selectedOffering}
        />
      )}
    </Container>
  );
}

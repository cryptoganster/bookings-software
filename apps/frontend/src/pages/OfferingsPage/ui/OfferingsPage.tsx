/**
 * OfferingsPage Component
 *
 * Main offerings management page that displays:
 * - List of offerings (services)
 * - Create/Edit/Delete actions
 * - Active/Inactive toggle
 *
 * Uses TanStack Query for server state management.
 * Performance optimizations:
 * - Memoized OfferingCard component
 * - useCallback for event handlers
 * - Lazy loaded modals
 */

import { useState, useCallback, lazy, Suspense } from "react";
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
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconAlertCircle, IconPlus } from "@tabler/icons-react";
import { PageHeader } from "@shared/ui/PageHeader/PageHeader";
import {
  useOfferings,
  useDeleteOffering,
  useToggleOfferingActive,
} from "@entities/offering";
import type { OfferingDto } from "@packages/shared-types";
import { OfferingCard } from "./OfferingCard";

// Lazy load modals for better initial page load performance
// Requirements: Performance - 11.2
const OfferingCreateModal = lazy(() =>
  import("./OfferingCreateModal").then((module) => ({
    default: module.OfferingCreateModal,
  })),
);
const OfferingEditModal = lazy(() =>
  import("./OfferingEditModal").then((module) => ({
    default: module.OfferingEditModal,
  })),
);

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
   * Memoized with useCallback for performance
   */
  const handleOpenCreateModal = useCallback(() => {
    setIsCreateModalOpen(true);
  }, []);

  /**
   * Cerrar modal de creación
   * Requirements: 1.3
   * Memoized with useCallback for performance
   */
  const handleCloseCreateModal = useCallback(() => {
    setIsCreateModalOpen(false);
  }, []);

  /**
   * Abrir modal de edición
   * Requirements: 2.1
   * Memoized with useCallback for performance
   */
  const handleOpenEditModal = useCallback((offering: OfferingDto) => {
    setSelectedOffering(offering);
    setIsEditModalOpen(true);
  }, []);

  /**
   * Cerrar modal de edición
   * Requirements: 2.6
   * Memoized with useCallback for performance
   */
  const handleCloseEditModal = useCallback(() => {
    setIsEditModalOpen(false);
    setSelectedOffering(null);
  }, []);

  /**
   * Eliminar offering con confirmación
   * Requirements: 5.3
   * Memoized with useCallback for performance
   */
  const handleDelete = useCallback(
    async (id: string) => {
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
    },
    [deleteOffering],
  );

  /**
   * Toggle active status
   * Requirements: 4.4
   * Memoized with useCallback for performance
   */
  const handleToggleActive = useCallback(
    async (id: string, currentStatus: boolean) => {
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
    },
    [toggleActive],
  );

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
                <OfferingCard
                  offering={offering}
                  onEdit={handleOpenEditModal}
                  onDelete={handleDelete}
                  onToggleActive={handleToggleActive}
                />
              </Grid.Col>
            ))}
          </Grid>
        )}
      </Stack>

      {/* Modal de creación con Suspense para lazy loading */}
      {/* Requirements: 1.1, Performance - 11.2 */}
      <Suspense fallback={<Loader size="sm" />}>
        <OfferingCreateModal
          opened={isCreateModalOpen}
          onClose={handleCloseCreateModal}
        />
      </Suspense>

      {/* Modal de edición con Suspense para lazy loading */}
      {/* Requirements: 2.1, Performance - 11.2 */}
      {selectedOffering && (
        <Suspense fallback={<Loader size="sm" />}>
          <OfferingEditModal
            opened={isEditModalOpen}
            onClose={handleCloseEditModal}
            offering={selectedOffering}
          />
        </Suspense>
      )}
    </Container>
  );
}

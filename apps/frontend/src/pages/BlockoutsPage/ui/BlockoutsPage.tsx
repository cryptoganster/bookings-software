/**
 * BlockoutsPage Component
 *
 * Main blockouts management page that displays:
 * - List of blockouts (date ranges when business is closed)
 * - Create/Delete actions
 *
 * Uses TanStack Query for server state management.
 */

import {
  Container,
  Stack,
  Button,
  Center,
  Text,
  Loader,
  Alert,
  Group,
  Card,
  ActionIcon,
  Badge,
} from "@mantine/core";
import {
  IconAlertCircle,
  IconPlus,
  IconTrash,
  IconCalendarOff,
} from "@tabler/icons-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { PageHeader } from "@shared/ui/PageHeader/PageHeader";
import { useBlockouts, useDeleteBlockout } from "@entities/blockout";

export function BlockoutsPage() {
  const { data: blockouts, isLoading, isError, error } = useBlockouts();
  const deleteBlockout = useDeleteBlockout();

  const handleDelete = async (id: string) => {
    if (window.confirm("¿Estás seguro de eliminar este bloqueo?")) {
      await deleteBlockout.mutateAsync(id);
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd MMM yyyy", { locale: es });
  };

  return (
    <Container fluid py="md">
      <Stack gap="lg">
        <Group justify="space-between">
          <PageHeader title="Bloqueos de Fechas" />
          <Button
            leftSection={<IconPlus size={16} />}
            radius="xl"
            onClick={() => {
              /* TODO: Open create modal */
            }}
          >
            Nuevo Bloqueo
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
            title="Error al cargar bloqueos"
            color="red"
            variant="light"
          >
            {error instanceof Error
              ? error.message
              : "Ocurrió un error inesperado"}
          </Alert>
        )}

        {/* Empty State */}
        {!isLoading && !isError && blockouts && blockouts.length === 0 && (
          <Center py="xl">
            <Stack align="center" gap="xs">
              <IconCalendarOff size={48} stroke={1.5} color="gray" />
              <Text size="lg" c="dimmed">
                No hay bloqueos configurados
              </Text>
              <Text size="sm" c="dimmed">
                Crea bloqueos para vacaciones o días festivos
              </Text>
            </Stack>
          </Center>
        )}

        {/* Blockouts List */}
        {!isLoading && !isError && blockouts && blockouts.length > 0 && (
          <Stack gap="md">
            {blockouts.map((blockout) => (
              <Card key={blockout.id} withBorder shadow="sm" radius="xl" p="lg">
                <Group justify="space-between">
                  <Stack gap="xs">
                    <Group gap="md">
                      <IconCalendarOff size={24} stroke={1.5} />
                      <div>
                        <Text fw={600} size="lg">
                          {formatDate(blockout.startDate)} -{" "}
                          {formatDate(blockout.endDate)}
                        </Text>
                        {blockout.reason && (
                          <Text size="sm" c="dimmed" mt={4}>
                            {blockout.reason}
                          </Text>
                        )}
                      </div>
                    </Group>

                    <Badge color="red" variant="light" size="sm" w="fit">
                      Negocio cerrado
                    </Badge>
                  </Stack>

                  <ActionIcon
                    variant="subtle"
                    color="red"
                    size="lg"
                    onClick={() => handleDelete(blockout.id)}
                  >
                    <IconTrash size={18} />
                  </ActionIcon>
                </Group>
              </Card>
            ))}
          </Stack>
        )}
      </Stack>
    </Container>
  );
}

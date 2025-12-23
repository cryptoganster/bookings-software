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

export function OfferingsPage() {
  const { data: offerings, isLoading, isError, error } = useOfferings();
  const deleteOffering = useDeleteOffering();
  const toggleActive = useToggleOfferingActive();

  const handleDelete = async (id: string) => {
    if (window.confirm("¿Estás seguro de eliminar este servicio?")) {
      await deleteOffering.mutateAsync(id);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    await toggleActive.mutateAsync({ id, isActive: !currentStatus });
  };

  return (
    <Container fluid py="md">
      <Stack gap="lg">
        <Group justify="space-between">
          <PageHeader title="Servicios" />
          <Button
            leftSection={<IconPlus size={16} />}
            radius="xl"
            onClick={() => {
              /* TODO: Open create modal */
            }}
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
                          <ActionIcon variant="subtle" color="gray">
                            <IconDots size={16} />
                          </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                          <Menu.Item
                            leftSection={<IconEdit size={14} />}
                            onClick={() => {
                              /* TODO: Open edit modal */
                            }}
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
                          >
                            {offering.isActive ? "Desactivar" : "Activar"}
                          </Menu.Item>
                          <Menu.Divider />
                          <Menu.Item
                            color="red"
                            leftSection={<IconTrash size={14} />}
                            onClick={() => handleDelete(offering.id)}
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
    </Container>
  );
}

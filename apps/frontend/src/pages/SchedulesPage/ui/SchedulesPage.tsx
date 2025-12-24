/**
 * SchedulesPage Component
 *
 * Main schedules management page that displays:
 * - List of schedules (business hours by day of week)
 * - Create/Edit/Delete actions
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
  Menu,
  Badge,
} from "@mantine/core";
import {
  IconAlertCircle,
  IconPlus,
  IconDots,
  IconEdit,
  IconTrash,
  IconClock,
} from "@tabler/icons-react";
import { useState } from "react";
import { notifications } from "@mantine/notifications";
import { PageHeader } from "@shared/ui/PageHeader/PageHeader";
import { useSchedules, useDeleteSchedule } from "@entities/schedule";
import type { ScheduleDto } from "@shared/api/services/schedules.service";
import { ScheduleCreateModal } from "./ScheduleCreateModal";
import { ScheduleEditModal } from "./ScheduleEditModal";

const DAYS_OF_WEEK = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

export function SchedulesPage() {
  const { data: schedules, isLoading, isError, error } = useSchedules();
  const deleteSchedule = useDeleteSchedule();

  const [createModalOpened, setCreateModalOpened] = useState(false);
  const [editModalOpened, setEditModalOpened] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleDto | null>(
    null,
  );

  const handleDelete = async (id: string) => {
    if (window.confirm("¿Estás seguro de eliminar este horario?")) {
      try {
        await deleteSchedule.mutateAsync(id);
        notifications.show({
          title: "Horario eliminado",
          message: "El horario se ha eliminado exitosamente",
          color: "green",
        });
      } catch {
        notifications.show({
          title: "Error",
          message: "No se pudo eliminar el horario",
          color: "red",
        });
      }
    }
  };

  const handleEdit = (schedule: ScheduleDto) => {
    setSelectedSchedule(schedule);
    setEditModalOpened(true);
  };

  // Group schedules by day of week
  const schedulesByDay = schedules?.reduce<Record<number, ScheduleDto[]>>(
    (acc, schedule) => {
      if (!acc[schedule.dayOfWeek]) {
        acc[schedule.dayOfWeek] = [];
      }
      acc[schedule.dayOfWeek].push(schedule);
      return acc;
    },
    {},
  );

  return (
    <Container fluid py="md">
      <Stack gap="lg">
        <Group justify="space-between">
          <PageHeader title="Horarios de Atención" />
          <Button
            leftSection={<IconPlus size={16} />}
            radius="xl"
            onClick={() => setCreateModalOpened(true)}
          >
            Nuevo Horario
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
            title="Error al cargar horarios"
            color="red"
            variant="light"
          >
            {error instanceof Error
              ? error.message
              : "Ocurrió un error inesperado"}
          </Alert>
        )}

        {/* Empty State */}
        {!isLoading && !isError && schedules && schedules.length === 0 && (
          <Center py="xl">
            <Stack align="center" gap="xs">
              <IconClock size={48} stroke={1.5} color="gray" />
              <Text size="lg" c="dimmed">
                No hay horarios configurados
              </Text>
              <Text size="sm" c="dimmed">
                Configura los horarios de atención de tu negocio
              </Text>
            </Stack>
          </Center>
        )}

        {/* Schedules by Day */}
        {!isLoading &&
          !isError &&
          schedules &&
          schedules.length > 0 &&
          schedulesByDay && (
            <Stack gap="md">
              {Object.entries(schedulesByDay)
                .sort(([a], [b]) => Number(a) - Number(b))
                .map(([dayOfWeek, daySchedules]) => (
                  <Card
                    key={dayOfWeek}
                    withBorder
                    shadow="sm"
                    radius="xl"
                    p="lg"
                  >
                    <Stack gap="md">
                      <Text fw={600} size="lg">
                        {DAYS_OF_WEEK[Number(dayOfWeek)]}
                      </Text>

                      <Stack gap="sm">
                        {daySchedules.map((schedule) => (
                          <Group
                            key={schedule.id}
                            justify="space-between"
                            p="sm"
                            style={{
                              borderRadius: "var(--mantine-radius-md)",
                              backgroundColor: "var(--mantine-color-gray-0)",
                            }}
                          >
                            <Group gap="md">
                              <IconClock size={20} stroke={1.5} />
                              <Text size="sm" fw={500}>
                                {schedule.startTime} - {schedule.endTime}
                              </Text>
                              {!schedule.isActive && (
                                <Badge color="gray" variant="light" size="sm">
                                  Inactivo
                                </Badge>
                              )}
                            </Group>

                            <Menu shadow="md" width={200}>
                              <Menu.Target>
                                <ActionIcon variant="subtle" color="gray">
                                  <IconDots size={16} />
                                </ActionIcon>
                              </Menu.Target>
                              <Menu.Dropdown>
                                <Menu.Item
                                  leftSection={<IconEdit size={14} />}
                                  onClick={() => handleEdit(schedule)}
                                >
                                  Editar
                                </Menu.Item>
                                <Menu.Divider />
                                <Menu.Item
                                  color="red"
                                  leftSection={<IconTrash size={14} />}
                                  onClick={() => handleDelete(schedule.id)}
                                >
                                  Eliminar
                                </Menu.Item>
                              </Menu.Dropdown>
                            </Menu>
                          </Group>
                        ))}
                      </Stack>
                    </Stack>
                  </Card>
                ))}
            </Stack>
          )}
      </Stack>

      {/* Modals */}
      <ScheduleCreateModal
        opened={createModalOpened}
        onClose={() => setCreateModalOpened(false)}
      />
      <ScheduleEditModal
        opened={editModalOpened}
        onClose={() => setEditModalOpened(false)}
        schedule={selectedSchedule}
      />
    </Container>
  );
}

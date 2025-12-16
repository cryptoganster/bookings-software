/**
 * UpcomingAppointments Widget
 *
 * Muestra las próximas 5 citas en el dashboard.
 * Incluye botón "Ver todas" para navegar a la página completa de appointments.
 */

import { Paper, Title, Stack, Button, Text, Group, Box } from "@mantine/core";
import { IconCalendar, IconArrowRight } from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import { useUpcomingAppointments } from "@entities/appointment";
import { AppointmentCard } from "@entities/appointment";
import { LoadingOverlay } from "@shared/ui/LoadingOverlay/LoadingOverlay";
import { EmptyState } from "@shared/ui/EmptyState/EmptyState";

export function UpcomingAppointments() {
  const navigate = useNavigate();
  const { data: appointments, isLoading, isError, error } = useUpcomingAppointments();

  const handleViewAll = () => {
    navigate("/appointments");
  };

  if (isLoading) {
    return (
      <Paper withBorder shadow="sm" p="md" radius="xl" pos="relative" mih={300}>
        <LoadingOverlay visible />
      </Paper>
    );
  }

  if (isError) {
    return (
      <Paper withBorder shadow="sm" p="md" radius="xl">
        <Title order={3} mb="md">
          Próximas Citas
        </Title>
        <Text c="red" size="sm">
          Error al cargar las citas: {error?.message || "Error desconocido"}
        </Text>
      </Paper>
    );
  }

  const upcomingList = appointments?.slice(0, 5) || [];

  return (
    <Paper withBorder shadow="sm" p="md" radius="xl">
      <Group justify="space-between" mb="md">
        <Group gap="xs">
          <IconCalendar size={24} stroke={1.5} />
          <Title order={3}>Próximas Citas</Title>
        </Group>
        <Button
          variant="subtle"
          color="brandGreen"
          rightSection={<IconArrowRight size={16} />}
          onClick={handleViewAll}
          radius="xl"
        >
          Ver todas
        </Button>
      </Group>

      {upcomingList.length === 0 ? (
        <EmptyState
          message="No hay citas próximas"
          icon={<IconCalendar size={48} stroke={1.5} />}
        />
      ) : (
        <Stack gap="sm">
          {upcomingList.map((appointment) => (
            <Box key={appointment.id}>
              <AppointmentCard appointment={appointment} />
            </Box>
          ))}
        </Stack>
      )}
    </Paper>
  );
}

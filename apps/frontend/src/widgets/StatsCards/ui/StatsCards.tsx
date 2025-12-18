import { SimpleGrid, Alert } from "@mantine/core";
import {
  IconCalendar,
  IconCalendarWeek,
  IconAlertCircle,
} from "@tabler/icons-react";
import { useStats } from "../model/useStats";
import { StatCard } from "./StatCard";
import { LoadingOverlay } from "@shared/ui/LoadingOverlay/LoadingOverlay";

export function StatsCards() {
  const { data: stats, isLoading, isError, error } = useStats();

  if (isLoading) {
    return <LoadingOverlay visible />;
  }

  if (isError) {
    return (
      <Alert
        icon={<IconAlertCircle size={16} />}
        title="Error al cargar estadísticas"
        color="red"
        radius="xl"
      >
        {error instanceof Error ? error.message : "Error desconocido"}
      </Alert>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
      <StatCard
        title="Citas Hoy"
        value={stats.appointmentsToday}
        icon={IconCalendar}
        color="brandGreen"
      />
      <StatCard
        title="Citas Esta Semana"
        value={stats.appointmentsThisWeek}
        icon={IconCalendarWeek}
        color="brandGreen"
      />
    </SimpleGrid>
  );
}

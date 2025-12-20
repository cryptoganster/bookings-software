import { SimpleGrid, Alert, Paper, Title, Group } from "@mantine/core";
import {
  IconUsers,
  IconUserPlus,
  IconUserCheck,
  IconAlertCircle,
} from "@tabler/icons-react";
import { useCustomerStats } from "../model/useCustomerStats";
import { CustomerStatCard } from "./CustomerStatCard";
import { LoadingOverlay } from "@shared/ui/LoadingOverlay/LoadingOverlay";

export function CustomerAnalytics() {
  const { data: stats, isLoading, isError, error } = useCustomerStats();

  if (isLoading) {
    return (
      <Paper withBorder shadow="sm" p="md" radius="xl" pos="relative" mih={200}>
        <LoadingOverlay visible />
      </Paper>
    );
  }

  if (isError) {
    return (
      <Alert
        icon={<IconAlertCircle size={16} />}
        title="Error al cargar estadísticas de clientes"
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

  const registeredPercentage =
    stats.totalCustomers > 0
      ? Math.round((stats.registeredCount / stats.totalCustomers) * 100)
      : 0;

  return (
    <Paper withBorder shadow="sm" p="md" radius="xl">
      <Group mb="md">
        <IconUsers size={24} stroke={1.5} />
        <Title order={3}>Análisis de Clientes</Title>
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
        <CustomerStatCard
          title="Total Clientes"
          value={stats.totalCustomers}
          icon={IconUsers}
          color="brandGreen"
          subtitle={`${stats.anonymousCount} anónimos, ${stats.registeredCount} registrados`}
        />
        <CustomerStatCard
          title="Nuevos Este Mes"
          value={stats.newThisMonth}
          icon={IconUserPlus}
          color="blue"
          subtitle={`${stats.newThisWeek} esta semana`}
        />
        <CustomerStatCard
          title="Clientes Registrados"
          value={`${registeredPercentage}%`}
          icon={IconUserCheck}
          color="teal"
          subtitle={`${stats.registeredCount} de ${stats.totalCustomers}`}
        />
      </SimpleGrid>
    </Paper>
  );
}

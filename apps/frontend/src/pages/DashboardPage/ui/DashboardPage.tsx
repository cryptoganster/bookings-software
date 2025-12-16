/**
 * DashboardPage Component
 *
 * Temporary placeholder for the Dashboard page.
 * Will be replaced with actual dashboard implementation in later phases.
 *
 * Requirements: 6.1, 6.4
 */

import { Container, Title, Text, Paper } from "@mantine/core";

export function DashboardPage() {
  return (
    <Container size="lg" py="xl">
      <Paper shadow="sm" p="xl" radius="md" withBorder>
        <Title order={1} mb="md">
          Dashboard
        </Title>
        <Text c="dimmed">
          Coming Soon - Dashboard with metrics and upcoming appointments
        </Text>
      </Paper>
    </Container>
  );
}

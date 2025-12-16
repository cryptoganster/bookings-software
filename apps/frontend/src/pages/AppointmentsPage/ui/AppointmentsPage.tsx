/**
 * AppointmentsPage Component
 * 
 * Temporary placeholder for the Appointments page.
 * Will be replaced with actual appointments management in later phases.
 * 
 * Requirements: 6.1, 6.4
 */

import { Container, Title, Text, Paper } from '@mantine/core';

export function AppointmentsPage() {
  return (
    <Container size="lg" py="xl">
      <Paper shadow="sm" p="xl" radius="md" withBorder>
        <Title order={1} mb="md">
          Appointments
        </Title>
        <Text c="dimmed">
          Coming Soon - Appointments list with filters and management
        </Text>
      </Paper>
    </Container>
  );
}

/**
 * DashboardPage Component
 *
 * Main dashboard page that displays:
 * - StatsCards widget with metrics (appointments today, this week)
 * - UpcomingAppointments widget with next 5 appointments
 *
 * Uses Mantine Grid for responsive layout.
 * Handles loading and error states through child widgets.
 *
 * Requirements: 3.1, 3.2, 3.3
 */

import { Container, Grid, Stack } from "@mantine/core";
import { StatsCards } from "@widgets/StatsCards";
import { UpcomingAppointments } from "@widgets/UpcomingAppointments";
import { PageHeader } from "@shared/ui/PageHeader/PageHeader";

export function DashboardPage() {
  return (
    <Container fluid py="md">
      <Stack gap="lg">
        <PageHeader title="Dashboard" />

        {/* Stats Cards Section */}
        <StatsCards />

        {/* Upcoming Appointments Section */}
        <Grid gutter="lg">
          <Grid.Col span={12}>
            <UpcomingAppointments />
          </Grid.Col>
        </Grid>
      </Stack>
    </Container>
  );
}

import { useState } from "react";
import { Paper, Stack, Text } from "@mantine/core";
import { format } from "date-fns";
import { getStatusColor } from "@entities/appointment";
import type { AppointmentReadModel } from "@entities/appointment";
import { AppointmentDetailsModal } from "@features/appointment/details";

interface AppointmentSlotProps {
  /** Appointment to display */
  appointment: AppointmentReadModel;
  /** Callback when appointment is clicked (optional, for testing) */
  onClick?: (appointment: AppointmentReadModel) => void;
}

/**
 * AppointmentSlot Component
 *
 * Displays a single appointment in a compact card format within a day column.
 * Shows time, offering name, and customer name with status-based color coding.
 * Clicking the slot opens a modal with full appointment details.
 *
 * @example
 * <AppointmentSlot appointment={appointment} />
 */
export function AppointmentSlot({
  appointment,
  onClick,
}: AppointmentSlotProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const statusColor = getStatusColor(appointment.status);
  const time = format(new Date(appointment.dateTime), "h:mm a");

  const handleClick = () => {
    setDetailsOpen(true);
    onClick?.(appointment);
  };

  const handleClose = () => {
    setDetailsOpen(false);
  };

  return (
    <>
      <Paper
        p="xs"
        radius="sm"
        onClick={handleClick}
        style={{
          backgroundColor: `var(--mantine-color-${statusColor}-1)`,
          borderLeft: `3px solid var(--mantine-color-${statusColor}-6)`,
          cursor: "pointer",
        }}
      >
        <Stack gap={4}>
          <Text size="xs" fw={700} c={statusColor}>
            {time}
          </Text>
          <Text size="sm" fw={500} lineClamp={1}>
            {appointment.offeringName}
          </Text>
          <Text size="xs" c="dimmed" lineClamp={1}>
            {appointment.customerName || "Sin nombre"}
          </Text>
        </Stack>
      </Paper>

      <AppointmentDetailsModal
        appointmentId={appointment.id}
        opened={detailsOpen}
        onClose={handleClose}
      />
    </>
  );
}

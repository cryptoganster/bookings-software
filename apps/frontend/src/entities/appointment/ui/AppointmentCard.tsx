/**
 * AppointmentCard Component
 *
 * Card de presentación para mostrar información de una cita
 */

import { Card, Group, Stack, Text, Avatar } from "@mantine/core";
import {
  IconCalendar,
  IconClock,
  IconScissors,
  IconUser,
  IconPhone,
} from "@tabler/icons-react";
import type { AppointmentReadModel } from "../model/types";
import { AppointmentBadge } from "./AppointmentBadge";
import {
  formatAppointmentDate,
  formatAppointmentTime,
  formatCustomerName,
  formatPhoneNumber,
} from "../lib/formatAppointment";

interface AppointmentCardProps {
  appointment: AppointmentReadModel;
  onClick?: () => void;
  actions?: React.ReactNode;
}

/**
 * Card que muestra información completa de una cita
 *
 * @example
 * ```tsx
 * <AppointmentCard
 *   appointment={appointment}
 *   onClick={() => handleViewDetails(appointment.id)}
 *   actions={
 *     <Button size="xs">Ver detalles</Button>
 *   }
 * />
 * ```
 */
export function AppointmentCard({
  appointment,
  onClick,
  actions,
}: AppointmentCardProps) {
  return (
    <Card
      shadow="sm"
      padding="lg"
      radius="md"
      withBorder
      style={{ cursor: onClick ? "pointer" : "default" }}
      onClick={onClick}
    >
      <Stack gap="md">
        {/* Header: Cliente y Status */}
        <Group justify="space-between" align="flex-start">
          <Group gap="sm">
            <Avatar color="brandGreen" radius="xl">
              <IconUser size={20} />
            </Avatar>
            <div>
              <Text fw={500} size="sm">
                {formatCustomerName(appointment)}
              </Text>
              <Group gap={4}>
                <IconPhone size={14} />
                <Text size="xs" c="dimmed">
                  {formatPhoneNumber(appointment.customerPhone)}
                </Text>
              </Group>
            </div>
          </Group>
          <AppointmentBadge status={appointment.status} />
        </Group>

        {/* Servicio */}
        <Group gap="xs">
          <IconScissors size={16} color="var(--mantine-color-brandGreen-6)" />
          <Text size="sm" fw={500}>
            {appointment.offeringName}
          </Text>
        </Group>

        {/* Fecha y Hora */}
        <Group gap="md">
          <Group gap="xs">
            <IconCalendar size={16} color="var(--mantine-color-gray-6)" />
            <Text size="sm" c="dimmed">
              {formatAppointmentDate(appointment.dateTime)}
            </Text>
          </Group>
          <Group gap="xs">
            <IconClock size={16} color="var(--mantine-color-gray-6)" />
            <Text size="sm" c="dimmed">
              {formatAppointmentTime(appointment.dateTime)}
            </Text>
          </Group>
        </Group>

        {/* Actions (si se proporcionan) */}
        {actions && (
          <Group justify="flex-end" mt="xs">
            {actions}
          </Group>
        )}
      </Stack>
    </Card>
  );
}

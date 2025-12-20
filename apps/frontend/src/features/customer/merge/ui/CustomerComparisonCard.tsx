/**
 * CustomerComparisonCard Component
 *
 * Displays customer information in a comparison format
 * Used in merge preview to show side-by-side comparison
 *
 * Requirements: 10.3
 */

import { Card, Stack, Group, Text, Badge, Avatar } from "@mantine/core";
import { IconPhone, IconCalendar, IconUser } from "@tabler/icons-react";
import type { CustomerReadModel } from "@packages/shared-types";
import {
  formatCustomerName,
  formatCustomerPhone,
  getCustomerInitials,
} from "@shared/lib/customer/formatters";

interface CustomerComparisonCardProps {
  customer: CustomerReadModel;
  label: string;
  color?: string;
}

/**
 * Customer comparison card for merge preview
 *
 * Features:
 * - Shows customer avatar with initials
 * - Displays name, phone, type badge
 * - Shows appointment count
 * - Color-coded label (source/target)
 *
 * @example
 * ```tsx
 * <CustomerComparisonCard
 *   customer={sourceCustomer}
 *   label="Cliente a fusionar"
 *   color="red"
 * />
 * ```
 */
export function CustomerComparisonCard({
  customer,
  label,
  color = "blue",
}: CustomerComparisonCardProps) {
  const isRegistered = customer.userId !== null;
  const initials = getCustomerInitials(customer);

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Stack gap="md">
        <Badge color={color} variant="light" size="lg">
          {label}
        </Badge>

        <Group>
          <Avatar color={isRegistered ? "blue" : "gray"} size="lg" radius="xl">
            {initials}
          </Avatar>

          <Stack gap={4}>
            <Text fw={500} size="lg">
              {formatCustomerName(customer)}
            </Text>

            <Badge color={isRegistered ? "green" : "gray"} variant="light">
              {isRegistered ? "Registrado" : "Anónimo"}
            </Badge>
          </Stack>
        </Group>

        <Stack gap="xs">
          <Group gap={8}>
            <IconPhone size={16} />
            <Text size="sm" c="dimmed">
              {formatCustomerPhone(customer.whatsappPhone)}
            </Text>
          </Group>

          {customer.appointmentCount !== undefined && (
            <Group gap={8}>
              <IconCalendar size={16} />
              <Text size="sm" c="dimmed">
                {customer.appointmentCount}{" "}
                {customer.appointmentCount === 1 ? "cita" : "citas"}
              </Text>
            </Group>
          )}

          {isRegistered && (
            <Group gap={8}>
              <IconUser size={16} />
              <Text size="sm" c="dimmed">
                Usuario registrado
              </Text>
            </Group>
          )}

          <Group gap={8}>
            <Text size="xs" c="dimmed">
              ID: {customer.id}
            </Text>
          </Group>
        </Stack>
      </Stack>
    </Card>
  );
}

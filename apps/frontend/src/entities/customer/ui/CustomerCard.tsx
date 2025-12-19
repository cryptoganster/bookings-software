import { Card, Group, Text, Badge, Avatar, Stack } from '@mantine/core';
import type { CustomerReadModel } from '@packages/shared-types';
import { formatCustomerName, formatCustomerPhone, getCustomerInitials } from '@shared/lib/customer/formatters';

interface CustomerCardProps {
  customer: CustomerReadModel;
  onClick?: () => void;
  showAppointmentCount?: boolean;
}

/**
 * Customer card component for displaying customer information
 * Used in lists and grids
 */
export function CustomerCard({ customer, onClick, showAppointmentCount = true }: CustomerCardProps) {
  const isRegistered = customer.userId !== null;
  const initials = getCustomerInitials(customer);
  
  return (
    <Card
      shadow="sm"
      padding="lg"
      radius="md"
      withBorder
      style={{ cursor: onClick ? 'pointer' : 'default' }}
      onClick={onClick}
    >
      <Group justify="space-between" mb="xs">
        <Group>
          <Avatar color={isRegistered ? 'blue' : 'gray'} radius="xl">
            {initials}
          </Avatar>
          <Stack gap={4}>
            <Text fw={500}>{formatCustomerName(customer)}</Text>
            <Text size="sm" c="dimmed">
              {formatCustomerPhone(customer.whatsappPhone)}
            </Text>
          </Stack>
        </Group>
        
        <Badge color={isRegistered ? 'green' : 'gray'} variant="light">
          {isRegistered ? 'Registrado' : 'Anónimo'}
        </Badge>
      </Group>
      
      {showAppointmentCount && customer.appointmentCount !== undefined && (
        <Text size="sm" c="dimmed" mt="xs">
          {customer.appointmentCount} {customer.appointmentCount === 1 ? 'cita' : 'citas'}
        </Text>
      )}
    </Card>
  );
}

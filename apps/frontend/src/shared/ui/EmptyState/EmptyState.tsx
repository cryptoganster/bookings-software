import { Stack, Text, Title } from "@mantine/core";
import { IconMoodEmpty } from "@tabler/icons-react";

interface EmptyStateProps {
  title?: string;
  message: string;
  icon?: React.ReactNode;
}

export function EmptyState({
  title = "No hay datos",
  message,
  icon,
}: EmptyStateProps) {
  return (
    <Stack align="center" justify="center" gap="md" py="xl">
      {icon || <IconMoodEmpty size={64} stroke={1.5} color="gray" />}
      <Title order={3} c="dimmed">
        {title}
      </Title>
      <Text c="dimmed" ta="center">
        {message}
      </Text>
    </Stack>
  );
}

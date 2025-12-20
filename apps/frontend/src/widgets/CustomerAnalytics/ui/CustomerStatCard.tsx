import { Paper, Text, Group, ThemeIcon } from "@mantine/core";
import type { Icon } from "@tabler/icons-react";

interface CustomerStatCardProps {
  title: string;
  value: number | string;
  icon: Icon;
  color: string;
  subtitle?: string;
}

export function CustomerStatCard({
  title,
  value,
  icon: Icon,
  color,
  subtitle,
}: CustomerStatCardProps) {
  return (
    <Paper withBorder shadow="sm" p="md" radius="xl">
      <Group justify="space-between">
        <div>
          <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
            {title}
          </Text>
          <Text fw={700} size="xl">
            {value}
          </Text>
          {subtitle && (
            <Text size="xs" c="dimmed" mt={4}>
              {subtitle}
            </Text>
          )}
        </div>
        <ThemeIcon color={color} size={38} radius="xl" variant="light">
          <Icon size={22} stroke={1.5} />
        </ThemeIcon>
      </Group>
    </Paper>
  );
}

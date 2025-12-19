import { Paper, Group, Text, ThemeIcon } from "@mantine/core";
import type { Icon as TablerIcon } from "@tabler/icons-react";

interface StatCardProps {
  title: string;
  value: number;
  icon: TablerIcon;
  color?: string;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  color = "brandGreen",
}: StatCardProps) {
  return (
    <Paper withBorder p="md" radius="xl" shadow="sm">
      <Group justify="space-between">
        <div>
          <Text c="dimmed" tt="uppercase" fw={700} fz="xs">
            {title}
          </Text>
          <Text fw={700} fz="xl" mt="xs">
            {value}
          </Text>
        </div>
        <ThemeIcon color={color} variant="light" size={60} radius="xl">
          <Icon size={32} stroke={1.5} />
        </ThemeIcon>
      </Group>
    </Paper>
  );
}

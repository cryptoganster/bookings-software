import { Stack, Text, Title } from "@mantine/core";
import { IconMoodEmpty } from "@tabler/icons-react";

interface EmptyStateProps {
  title?: string;
  message: string;
  icon?: React.ReactNode;
  size?: "sm" | "md" | "lg";
}

export function EmptyState({
  title = "No hay datos",
  message,
  icon,
  size = "md",
}: EmptyStateProps) {
  const iconSize = size === "sm" ? 32 : size === "lg" ? 96 : 64;
  const titleOrder = size === "sm" ? 5 : size === "lg" ? 2 : 3;
  const textSize = size === "sm" ? "xs" : size === "lg" ? "md" : "sm";
  const padding = size === "sm" ? "sm" : size === "lg" ? "xl" : "md";

  return (
    <Stack align="center" justify="center" gap={size} py={padding}>
      {icon || <IconMoodEmpty size={iconSize} stroke={1.5} color="gray" />}
      {title && (
        <Title order={titleOrder} c="dimmed">
          {title}
        </Title>
      )}
      <Text c="dimmed" ta="center" size={textSize}>
        {message}
      </Text>
    </Stack>
  );
}

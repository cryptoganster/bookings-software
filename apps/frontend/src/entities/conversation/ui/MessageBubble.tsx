import { Paper, Text, Group, Divider } from "@mantine/core";
import { IconClock } from "@tabler/icons-react";
import type { MessageDto } from "@packages/shared-types";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface MessageBubbleProps {
  message: MessageDto;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isOutbound = message.direction === "OUTBOUND";

  return (
    <Paper
      p="md"
      withBorder
      style={{
        marginLeft: isOutbound ? "auto" : 0,
        marginRight: isOutbound ? 0 : "auto",
        maxWidth: "70%",
        backgroundColor: isOutbound ? "var(--mantine-color-blue-0)" : undefined,
      }}
    >
      <Text size="sm" mb="xs" style={{ whiteSpace: "pre-wrap" }}>
        {message.content}
      </Text>

      <Divider my="xs" />

      <Group gap="xs" justify="space-between">
        <Text size="xs" c="dimmed" fw={500}>
          {isOutbound ? "Tú" : "Cliente"}
          {message.isFromAdmin && " (Admin)"}
        </Text>
        <Group gap="xs">
          <IconClock size={12} />
          <Text size="xs" c="dimmed">
            {format(new Date(message.sentAt), "PPp", { locale: es })}
          </Text>
        </Group>
      </Group>
    </Paper>
  );
}

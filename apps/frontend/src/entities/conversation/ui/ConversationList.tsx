import { Stack, Text, Badge, Group, Paper, ScrollArea } from "@mantine/core";
import { IconClock, IconUser } from "@tabler/icons-react";
import type { ConversationReadModel } from "@packages/shared-types";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface ConversationListProps {
  conversations: ConversationReadModel[];
  selectedId?: string;
  onSelect: (conversation: ConversationReadModel) => void;
}

export function ConversationList({
  conversations,
  selectedId,
  onSelect,
}: ConversationListProps) {
  if (conversations.length === 0) {
    return (
      <Paper p="xl" withBorder>
        <Text c="dimmed" ta="center">
          No hay conversaciones pendientes
        </Text>
      </Paper>
    );
  }

  return (
    <ScrollArea h="calc(100vh - 200px)">
      <Stack gap="xs">
        {conversations.map((conversation) => (
          <Paper
            key={conversation.id}
            p="md"
            withBorder
            style={{
              cursor: "pointer",
              backgroundColor:
                selectedId === conversation.id
                  ? "var(--mantine-color-blue-0)"
                  : undefined,
            }}
            onClick={() => onSelect(conversation)}
          >
            <Group justify="space-between" mb="xs">
              <Group gap="xs">
                <IconUser size={16} />
                <Text fw={500}>{conversation.customerName || "Cliente"}</Text>
              </Group>
              <Badge
                color={
                  conversation.status === "AWAITING_ADMIN" ? "red" : "gray"
                }
                variant="light"
              >
                {conversation.status === "AWAITING_ADMIN"
                  ? "Pendiente"
                  : conversation.status === "ACTIVE"
                    ? "Activa"
                    : "Resuelta"}
              </Badge>
            </Group>

            <Text size="sm" c="dimmed" lineClamp={2} mb="xs">
              Última actividad
            </Text>

            <Group gap="xs">
              <IconClock size={14} />
              <Text size="xs" c="dimmed">
                {formatDistanceToNow(new Date(conversation.lastMessageAt), {
                  addSuffix: true,
                  locale: es,
                })}
              </Text>
            </Group>
          </Paper>
        ))}
      </Stack>
    </ScrollArea>
  );
}

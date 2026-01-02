import {
  Stack,
  Paper,
  Text,
  Group,
  Badge,
  ScrollArea,
  Divider,
} from "@mantine/core";
import { IconUser, IconClock } from "@tabler/icons-react";
import type { ConversationReadModel, MessageDto } from "@packages/shared-types";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ConversationDetailProps {
  conversation: ConversationReadModel;
  messages: MessageDto[];
}

export function ConversationDetail({
  conversation,
  messages,
}: ConversationDetailProps) {
  return (
    <Stack gap="md" h="100%">
      {/* Header */}
      <Paper p="md" withBorder>
        <Group justify="space-between">
          <Group gap="xs">
            <IconUser size={20} />
            <div>
              <Text fw={500}>{conversation.customerName || "Cliente"}</Text>
              <Text size="sm" c="dimmed">
                {conversation.customerPhone}
              </Text>
            </div>
          </Group>
          <Badge
            color={conversation.status === "AWAITING_ADMIN" ? "red" : "gray"}
            variant="light"
          >
            {conversation.status === "AWAITING_ADMIN"
              ? "Pendiente"
              : conversation.status === "ACTIVE"
                ? "Activa"
                : "Resuelta"}
          </Badge>
        </Group>
      </Paper>

      {/* Messages */}
      <ScrollArea flex={1}>
        <Stack gap="md">
          {messages.map((message) => (
            <Paper
              key={message.id}
              p="md"
              withBorder
              style={{
                marginLeft: message.direction === "OUTBOUND" ? "auto" : 0,
                marginRight: message.direction === "INBOUND" ? "auto" : 0,
                maxWidth: "70%",
                backgroundColor:
                  message.direction === "OUTBOUND"
                    ? "var(--mantine-color-blue-0)"
                    : undefined,
              }}
            >
              <Text size="sm" mb="xs">
                {message.content}
              </Text>
              <Divider my="xs" />
              <Group gap="xs" justify="space-between">
                <Text size="xs" c="dimmed">
                  {message.direction === "OUTBOUND" ? "Tú" : "Cliente"}
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
          ))}
        </Stack>
      </ScrollArea>
    </Stack>
  );
}

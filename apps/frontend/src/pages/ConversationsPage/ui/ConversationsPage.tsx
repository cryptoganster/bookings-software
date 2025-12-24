/**
 * ConversationsPage Component
 *
 * Main conversations management page that displays:
 * - List of pending admin queries
 * - Conversation history (messages)
 * - Send admin response action
 *
 * Uses TanStack Query for server state management.
 */

import {
  Container,
  Stack,
  Center,
  Text,
  Loader,
  Alert,
  Card,
  Group,
  Badge,
  Button,
  Modal,
  Textarea,
} from "@mantine/core";
import {
  IconAlertCircle,
  IconMessageCircle,
  IconSend,
} from "@tabler/icons-react";
import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { PageHeader } from "@shared/ui/PageHeader/PageHeader";
import {
  useConversations,
  useConversationHistory,
  useSendAdminResponse,
} from "@entities/conversation";

export function ConversationsPage() {
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const [responseText, setResponseText] = useState("");

  const { data: conversations, isLoading, isError, error } = useConversations();

  const {
    data: messages,
    isLoading: isLoadingMessages,
    isError: isErrorMessages,
  } = useConversationHistory(selectedConversationId || "");

  const sendResponse = useSendAdminResponse();

  const handleOpenConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    setResponseText("");
  };

  const handleCloseModal = () => {
    setSelectedConversationId(null);
    setResponseText("");
  };

  const handleSendResponse = async () => {
    if (!selectedConversationId || !responseText.trim()) return;

    await sendResponse.mutateAsync({
      conversationId: selectedConversationId,
      content: responseText.trim(),
    });

    handleCloseModal();
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd MMM yyyy HH:mm", { locale: es });
  };

  // Find selected conversation details
  const selectedConversation = conversations?.find(
    (c) => c.id === selectedConversationId,
  );

  return (
    <Container fluid py="md">
      <Stack gap="lg">
        <PageHeader title="Consultas de Clientes" />

        {/* Loading State */}
        {isLoading && (
          <Center py="xl">
            <Loader size="lg" />
          </Center>
        )}

        {/* Error State */}
        {isError && (
          <Alert
            icon={<IconAlertCircle size={16} />}
            title="Error al cargar consultas"
            color="red"
            variant="light"
          >
            {error instanceof Error
              ? error.message
              : "Ocurrió un error inesperado"}
          </Alert>
        )}

        {/* Empty State */}
        {!isLoading &&
          !isError &&
          conversations &&
          conversations.length === 0 && (
            <Center py="xl">
              <Stack align="center" gap="xs">
                <IconMessageCircle size={48} stroke={1.5} color="gray" />
                <Text size="lg" c="dimmed">
                  No hay consultas pendientes
                </Text>
                <Text size="sm" c="dimmed">
                  Las consultas de clientes aparecerán aquí
                </Text>
              </Stack>
            </Center>
          )}

        {/* Conversations List */}
        {!isLoading &&
          !isError &&
          conversations &&
          conversations.length > 0 && (
            <Stack gap="md">
              {conversations.map((conv) => (
                <Card
                  key={conv.id}
                  withBorder
                  shadow="sm"
                  radius="xl"
                  p="lg"
                  style={{ cursor: "pointer" }}
                  onClick={() => handleOpenConversation(conv.id)}
                >
                  <Group justify="space-between">
                    <Stack gap="xs">
                      <Group gap="md">
                        <IconMessageCircle size={24} stroke={1.5} />
                        <div>
                          <Text fw={600} size="lg">
                            Cliente: {conv.customerName || "Anónimo"}
                          </Text>
                          <Text size="sm" c="dimmed">
                            {conv.customerPhone}
                          </Text>
                        </div>
                      </Group>

                      <Text size="sm" c="dimmed">
                        Última actividad: {formatDate(conv.lastMessageAt)}
                      </Text>
                    </Stack>

                    <Badge color="orange" variant="light" size="lg">
                      Pendiente
                    </Badge>
                  </Group>
                </Card>
              ))}
            </Stack>
          )}
      </Stack>

      {/* Conversation Detail Modal */}
      <Modal
        opened={!!selectedConversationId}
        onClose={handleCloseModal}
        title="Conversación con Cliente"
        size="lg"
        radius="xl"
      >
        {isLoadingMessages && (
          <Center py="xl">
            <Loader size="md" />
          </Center>
        )}

        {isErrorMessages && (
          <Alert
            icon={<IconAlertCircle size={16} />}
            title="Error al cargar conversación"
            color="red"
            variant="light"
          >
            No se pudo cargar la conversación
          </Alert>
        )}

        {selectedConversation && messages && (
          <Stack gap="md">
            {/* Customer Info */}
            <Card withBorder p="md" radius="md">
              <Stack gap="xs">
                <Text fw={600}>
                  {selectedConversation.customerName || "Cliente Anónimo"}
                </Text>
                <Text size="sm" c="dimmed">
                  {selectedConversation.customerPhone}
                </Text>
              </Stack>
            </Card>

            {/* Messages */}
            <Stack gap="sm">
              {messages.map((message) => (
                <Card
                  key={message.id}
                  withBorder
                  p="md"
                  radius="md"
                  bg={
                    message.direction === "INBOUND" ? "gray.0" : "brandGreen.0"
                  }
                >
                  <Stack gap="xs">
                    <Group justify="space-between">
                      <Badge
                        color={
                          message.direction === "INBOUND" ? "blue" : "green"
                        }
                        variant="light"
                        size="sm"
                      >
                        {message.direction === "INBOUND"
                          ? "Cliente"
                          : message.isFromAdmin
                            ? "Admin"
                            : "Negocio"}
                      </Badge>
                      <Text size="xs" c="dimmed">
                        {formatDate(message.sentAt)}
                      </Text>
                    </Group>
                    <Text size="sm">{message.content}</Text>
                  </Stack>
                </Card>
              ))}
            </Stack>

            {/* Response Form */}
            <Stack gap="sm">
              <Textarea
                placeholder="Escribe tu respuesta..."
                value={responseText}
                onChange={(e) => setResponseText(e.currentTarget.value)}
                minRows={3}
                radius="md"
              />
              <Button
                leftSection={<IconSend size={16} />}
                onClick={handleSendResponse}
                loading={sendResponse.isPending}
                disabled={!responseText.trim()}
                radius="xl"
              >
                Enviar Respuesta
              </Button>
            </Stack>
          </Stack>
        )}
      </Modal>
    </Container>
  );
}

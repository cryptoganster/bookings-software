import { useState } from "react";
import { Stack, Textarea, Button, Group, Alert } from "@mantine/core";
import { IconSend, IconAlertCircle } from "@tabler/icons-react";

interface AdminResponseFormProps {
  onSubmit: (message: string) => Promise<void>;
  isLoading?: boolean;
}

export function AdminResponseForm({
  onSubmit,
  isLoading = false,
}: AdminResponseFormProps) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!message.trim()) {
      setError("El mensaje no puede estar vacío");
      return;
    }

    try {
      setError(null);
      await onSubmit(message);
      setMessage(""); // Clear on success
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al enviar el mensaje",
      );
    }
  };

  return (
    <Stack gap="md">
      {error && (
        <Alert
          icon={<IconAlertCircle size={16} />}
          color="red"
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      <Textarea
        placeholder="Escribe tu respuesta al cliente..."
        value={message}
        onChange={(e) => setMessage(e.currentTarget.value)}
        minRows={3}
        maxRows={6}
        disabled={isLoading}
        autosize
      />

      <Group justify="flex-end">
        <Button
          leftSection={<IconSend size={16} />}
          onClick={handleSubmit}
          loading={isLoading}
          disabled={!message.trim()}
        >
          Enviar Respuesta
        </Button>
      </Group>
    </Stack>
  );
}

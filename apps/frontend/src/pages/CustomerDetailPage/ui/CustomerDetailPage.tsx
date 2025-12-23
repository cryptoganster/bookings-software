/**
 * CustomerDetailPage Component
 *
 * Displays detailed information about a single customer:
 * - Customer info (name, phone, type, registration status)
 * - Appointment history
 * - Conversations (future)
 * - Action buttons (Edit, Merge, Delete, Export)
 *
 * Uses TanStack Query for data fetching.
 * Implements optimistic updates for mutations.
 *
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6
 */

import {
  Container,
  Stack,
  Paper,
  Group,
  Text,
  Badge,
  Avatar,
  Button,
  Loader,
  Alert,
  Title,
  Divider,
  Card,
  Modal,
  Select,
} from "@mantine/core";
import {
  IconAlertCircle,
  IconArrowLeft,
  IconEdit,
  IconGitMerge,
  IconTrash,
  IconDownload,
  IconCalendar,
  IconPhone,
  IconUser,
} from "@tabler/icons-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { notifications } from "@mantine/notifications";
import { useCustomer } from "@entities/customer";
import {
  formatCustomerName,
  formatCustomerPhone,
  getCustomerInitials,
} from "@shared/lib/customer/formatters";
import { logger } from "@shared/lib/logger";

export function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [exportModalOpened, setExportModalOpened] = useState(false);
  const [exportFormat, setExportFormat] = useState<string>("json");

  const { data: customer, isLoading, isError, error } = useCustomer(id!);

  const handleBack = () => {
    navigate("/customers");
  };

  const handleEdit = () => {
    // TODO: Implement edit functionality
    logger.debug("Edit customer action triggered", { customerId: id });
    notifications.show({
      title: "Funcionalidad en desarrollo",
      message: "La edición de clientes estará disponible próximamente",
      color: "blue",
    });
  };

  const handleMerge = () => {
    // TODO: Implement merge functionality
    logger.debug("Merge customer action triggered", { customerId: id });
    notifications.show({
      title: "Funcionalidad en desarrollo",
      message: "La fusión de clientes estará disponible próximamente",
      color: "blue",
    });
  };

  const handleDelete = () => {
    // TODO: Implement delete functionality
    logger.debug("Delete customer action triggered", { customerId: id });
    notifications.show({
      title: "Funcionalidad en desarrollo",
      message: "La eliminación de clientes estará disponible próximamente",
      color: "blue",
    });
  };

  const handleExport = () => {
    setExportModalOpened(true);
  };

  const handleExportConfirm = () => {
    if (!customer) return;

    try {
      let content: string;
      let filename: string;
      let mimeType: string;

      if (exportFormat === "json") {
        content = JSON.stringify(customer, null, 2);
        filename = `customer-${customer.id}.json`;
        mimeType = "application/json";
      } else {
        // CSV format
        const headers = [
          "ID",
          "Nombre",
          "Teléfono",
          "User ID",
          "Fecha de Registro",
          "Número de Citas",
        ];
        const values = [
          customer.id,
          formatCustomerName(customer),
          formatCustomerPhone(customer.whatsappPhone),
          customer.userId || "N/A",
          new Date(customer.createdAt).toLocaleDateString("es-ES"),
          customer.appointmentCount?.toString() || "0",
        ];
        content = `${headers.join(",")}\n${values.join(",")}`;
        filename = `customer-${customer.id}.csv`;
        mimeType = "text/csv";
      }

      // Create blob and download
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      logger.info("Customer data exported", {
        customerId: customer.id,
        format: exportFormat,
      });

      notifications.show({
        title: "Exportación exitosa",
        message: `Datos del cliente exportados en formato ${exportFormat.toUpperCase()}`,
        color: "green",
      });

      setExportModalOpened(false);
    } catch (error) {
      logger.error("Failed to export customer data", { error, customerId: id });
      notifications.show({
        title: "Error al exportar",
        message: "No se pudo exportar los datos del cliente",
        color: "red",
      });
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <Container fluid py="md">
        <Stack align="center" py="xl">
          <Loader size="lg" />
          <Text c="dimmed">Cargando información del cliente...</Text>
        </Stack>
      </Container>
    );
  }

  // Error state
  if (isError || !customer) {
    return (
      <Container fluid py="md">
        <Stack gap="md">
          <Button
            variant="subtle"
            leftSection={<IconArrowLeft size={16} />}
            onClick={handleBack}
          >
            Volver a clientes
          </Button>

          <Alert
            icon={<IconAlertCircle size={16} />}
            title="Error al cargar cliente"
            color="red"
            variant="light"
          >
            {error instanceof Error
              ? error.message
              : "No se pudo cargar la información del cliente"}
          </Alert>
        </Stack>
      </Container>
    );
  }

  const isRegistered = customer.userId !== null;
  const initials = getCustomerInitials(customer);

  return (
    <Container fluid py="md">
      <Stack gap="lg">
        {/* Back Button */}
        <Button
          variant="subtle"
          leftSection={<IconArrowLeft size={16} />}
          onClick={handleBack}
          w="fit-content"
        >
          Volver a clientes
        </Button>

        {/* Customer Header */}
        <Paper shadow="sm" p="lg" radius="md" withBorder>
          <Group justify="space-between" wrap="nowrap">
            <Group>
              <Avatar
                color={isRegistered ? "blue" : "gray"}
                size="xl"
                radius="xl"
              >
                {initials}
              </Avatar>

              <Stack gap={4}>
                <Group gap="sm">
                  <Title order={2}>{formatCustomerName(customer)}</Title>
                  <Badge
                    color={isRegistered ? "green" : "gray"}
                    variant="light"
                    size="lg"
                  >
                    {isRegistered ? "Registrado" : "Anónimo"}
                  </Badge>
                </Group>

                <Group gap="md">
                  <Group gap={4}>
                    <IconPhone size={16} />
                    <Text size="sm" c="dimmed">
                      {formatCustomerPhone(customer.whatsappPhone)}
                    </Text>
                  </Group>

                  {customer.appointmentCount !== undefined && (
                    <Group gap={4}>
                      <IconCalendar size={16} />
                      <Text size="sm" c="dimmed">
                        {customer.appointmentCount}{" "}
                        {customer.appointmentCount === 1 ? "cita" : "citas"}
                      </Text>
                    </Group>
                  )}

                  {isRegistered && (
                    <Group gap={4}>
                      <IconUser size={16} />
                      <Text size="sm" c="dimmed">
                        Usuario registrado
                      </Text>
                    </Group>
                  )}
                </Group>
              </Stack>
            </Group>

            {/* Action Buttons */}
            <Group gap="sm">
              <Button
                variant="light"
                leftSection={<IconEdit size={16} />}
                onClick={handleEdit}
              >
                Editar
              </Button>

              <Button
                variant="light"
                color="blue"
                leftSection={<IconGitMerge size={16} />}
                onClick={handleMerge}
              >
                Fusionar
              </Button>

              <Button
                variant="light"
                color="cyan"
                leftSection={<IconDownload size={16} />}
                onClick={handleExport}
              >
                Exportar
              </Button>

              <Button
                variant="light"
                color="red"
                leftSection={<IconTrash size={16} />}
                onClick={handleDelete}
              >
                Eliminar
              </Button>
            </Group>
          </Group>
        </Paper>

        <Divider />

        {/* Customer Details */}
        <Paper shadow="sm" p="lg" radius="md" withBorder>
          <Stack gap="md">
            <Title order={3}>Información del Cliente</Title>

            <Group grow>
              <Card withBorder>
                <Stack gap="xs">
                  <Text size="sm" c="dimmed">
                    ID
                  </Text>
                  <Text size="sm" fw={500} style={{ fontFamily: "monospace" }}>
                    {customer.id}
                  </Text>
                </Stack>
              </Card>

              <Card withBorder>
                <Stack gap="xs">
                  <Text size="sm" c="dimmed">
                    Fecha de registro
                  </Text>
                  <Text size="sm" fw={500}>
                    {new Date(customer.createdAt).toLocaleDateString("es-ES", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </Text>
                </Stack>
              </Card>

              {customer.userId && (
                <Card withBorder>
                  <Stack gap="xs">
                    <Text size="sm" c="dimmed">
                      User ID
                    </Text>
                    <Text
                      size="sm"
                      fw={500}
                      style={{ fontFamily: "monospace" }}
                    >
                      {customer.userId}
                    </Text>
                  </Stack>
                </Card>
              )}
            </Group>
          </Stack>
        </Paper>

        {/* Appointment History Section */}
        <Paper shadow="sm" p="lg" radius="md" withBorder>
          <Stack gap="md">
            <Title order={3}>Historial de Citas</Title>
            <Text c="dimmed">
              Esta sección mostrará el historial de citas del cliente.
            </Text>
            {/* TODO: Implement appointment history list */}
          </Stack>
        </Paper>

        {/* Conversations Section */}
        <Paper shadow="sm" p="lg" radius="md" withBorder>
          <Stack gap="md">
            <Title order={3}>Conversaciones</Title>
            <Text c="dimmed">
              Esta sección mostrará las conversaciones con el cliente.
            </Text>
            {/* TODO: Implement conversations list */}
          </Stack>
        </Paper>
      </Stack>

      {/* Export Modal */}
      <Modal
        opened={exportModalOpened}
        onClose={() => setExportModalOpened(false)}
        title="Exportar datos del cliente"
        centered
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Selecciona el formato en el que deseas exportar los datos del
            cliente.
          </Text>

          <Select
            label="Formato de exportación"
            placeholder="Selecciona un formato"
            value={exportFormat}
            onChange={(value) => setExportFormat(value || "json")}
            data={[
              { value: "json", label: "JSON" },
              { value: "csv", label: "CSV" },
            ]}
          />

          <Group justify="flex-end" gap="sm">
            <Button
              variant="subtle"
              onClick={() => setExportModalOpened(false)}
            >
              Cancelar
            </Button>
            <Button
              leftSection={<IconDownload size={16} />}
              onClick={handleExportConfirm}
            >
              Exportar
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}

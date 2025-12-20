import {
  Container,
  Title,
  Text,
  Stack,
  Paper,
  Group,
  Button,
  Badge,
  Alert,
  Box,
} from "@mantine/core";
import {
  IconGitMerge,
  IconX,
  IconAlertCircle,
  IconUsers,
} from "@tabler/icons-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { detectDuplicateCustomers } from "@shared/api/customers";
import type { DuplicateCustomerPair } from "@shared/api/customers";
import { LoadingOverlay } from "@shared/ui/LoadingOverlay/LoadingOverlay";
import { EmptyState } from "@shared/ui/EmptyState/EmptyState";
import { CustomerCard } from "@entities/customer";
import { MergeCustomersModal } from "@features/customer/merge";
import { notifications } from "@mantine/notifications";

export function CustomerDuplicatesPage() {
  const queryClient = useQueryClient();
  const [selectedPair, setSelectedPair] =
    useState<DuplicateCustomerPair | null>(null);
  const [mergeModalOpen, setMergeModalOpen] = useState(false);

  const {
    data: duplicates,
    isLoading,
    isError,
    error,
  } = useQuery<DuplicateCustomerPair[]>({
    queryKey: ["customerDuplicates"],
    queryFn: () => detectDuplicateCustomers(0.8),
  });

  const markAsNotDuplicateMutation = useMutation({
    mutationFn: async () => {
      // In a real implementation, this would call an API endpoint
      // to mark the pair as "not duplicates" so they don't appear again
      await new Promise((resolve) => setTimeout(resolve, 500));
    },
    onSuccess: () => {
      notifications.show({
        title: "Marcado como no duplicado",
        message: "Este par no se mostrará nuevamente",
        color: "green",
      });
      queryClient.invalidateQueries({ queryKey: ["customerDuplicates"] });
    },
    onError: () => {
      notifications.show({
        title: "Error",
        message: "No se pudo marcar como no duplicado",
        color: "red",
      });
    },
  });

  const handleMerge = (pair: DuplicateCustomerPair) => {
    setSelectedPair(pair);
    setMergeModalOpen(true);
  };

  const handleNotDuplicate = () => {
    markAsNotDuplicateMutation.mutate();
  };

  const getSimilarityColor = (score: number): string => {
    if (score >= 0.9) return "red";
    if (score >= 0.8) return "orange";
    return "yellow";
  };

  if (isLoading) {
    return (
      <Container size="xl" py="xl">
        <LoadingOverlay visible />
      </Container>
    );
  }

  if (isError) {
    return (
      <Container size="xl" py="xl">
        <Alert
          icon={<IconAlertCircle size={16} />}
          title="Error al cargar duplicados"
          color="red"
          radius="xl"
        >
          {error instanceof Error ? error.message : "Error desconocido"}
        </Alert>
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        <div>
          <Title order={1} mb="xs">
            Clientes Duplicados
          </Title>
          <Text c="dimmed">
            Revisa y fusiona clientes que parecen ser duplicados
          </Text>
        </div>

        {!duplicates || duplicates.length === 0 ? (
          <EmptyState
            message="No se encontraron clientes duplicados"
            icon={<IconUsers size={48} stroke={1.5} />}
          />
        ) : (
          <Stack gap="md">
            {duplicates.map((pair, index) => (
              <Paper key={index} withBorder shadow="sm" p="md" radius="xl">
                <Stack gap="md">
                  <Group justify="space-between">
                    <Group gap="xs">
                      <Badge
                        color={getSimilarityColor(pair.similarityScore)}
                        size="lg"
                        radius="xl"
                      >
                        {Math.round(pair.similarityScore * 100)}% similitud
                      </Badge>
                      <Text size="sm" c="dimmed">
                        {pair.reasons.join(", ")}
                      </Text>
                    </Group>
                    <Group gap="xs">
                      <Button
                        leftSection={<IconGitMerge size={16} />}
                        color="brandGreen"
                        radius="xl"
                        onClick={() => handleMerge(pair)}
                      >
                        Fusionar
                      </Button>
                      <Button
                        leftSection={<IconX size={16} />}
                        variant="light"
                        color="gray"
                        radius="xl"
                        onClick={() => handleNotDuplicate()}
                        loading={markAsNotDuplicateMutation.isPending}
                      >
                        No son duplicados
                      </Button>
                    </Group>
                  </Group>

                  <Group grow align="flex-start">
                    <Box>
                      <Text size="sm" fw={500} mb="xs" c="dimmed">
                        Cliente 1
                      </Text>
                      <CustomerCard customer={pair.customer1} />
                    </Box>
                    <Box>
                      <Text size="sm" fw={500} mb="xs" c="dimmed">
                        Cliente 2
                      </Text>
                      <CustomerCard customer={pair.customer2} />
                    </Box>
                  </Group>
                </Stack>
              </Paper>
            ))}
          </Stack>
        )}
      </Stack>

      {selectedPair && (
        <MergeCustomersModal
          opened={mergeModalOpen}
          onClose={() => {
            setMergeModalOpen(false);
            setSelectedPair(null);
          }}
          sourceCustomer={selectedPair.customer1}
          targetCustomer={selectedPair.customer2}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["customerDuplicates"] });
          }}
        />
      )}
    </Container>
  );
}

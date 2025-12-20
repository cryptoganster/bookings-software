/**
 * CustomersPage Component
 *
 * Main customers list page that displays:
 * - Search form with debounced input
 * - Filter controls (type, sort)
 * - Customer cards grid
 * - Pagination controls
 *
 * Uses TanStack Query for server state management.
 * Implements debounced search (300ms) for better UX.
 *
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6
 */

import {
  Container,
  Stack,
  Grid,
  Pagination,
  Center,
  Text,
  Loader,
  Alert,
} from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@shared/ui/PageHeader/PageHeader";
import {
  SearchCustomersForm,
  CustomerFilters,
  useSearchCustomers,
} from "@features/customer/search";
import { CustomerCard } from "@entities/customer";

export function CustomersPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const limit = 12; // 12 customers per page (3x4 grid)

  const { data, isLoading, isError, error, filters, updateFilters } =
    useSearchCustomers({ page, limit });

  const handleCustomerClick = (customerId: string) => {
    navigate(`/customers/${customerId}`);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <Container fluid py="md">
      <Stack gap="lg">
        <PageHeader title="Clientes" />

        {/* Search and Filters Section */}
        <Stack gap="md">
          <SearchCustomersForm
            value={filters.searchText || ""}
            onChange={(value) => {
              updateFilters({ searchText: value });
              setPage(1); // Reset to first page on search
            }}
          />

          <CustomerFilters
            filters={filters}
            onChange={(newFilters) => {
              updateFilters(newFilters);
              setPage(1); // Reset to first page on filter change
            }}
          />
        </Stack>

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
            title="Error al cargar clientes"
            color="red"
            variant="light"
          >
            {error instanceof Error
              ? error.message
              : "Ocurrió un error inesperado"}
          </Alert>
        )}

        {/* Empty State */}
        {!isLoading && !isError && data && data.customers.length === 0 && (
          <Center py="xl">
            <Stack align="center" gap="xs">
              <Text size="lg" c="dimmed">
                No se encontraron clientes
              </Text>
              {filters.searchText && (
                <Text size="sm" c="dimmed">
                  Intenta con otros términos de búsqueda
                </Text>
              )}
            </Stack>
          </Center>
        )}

        {/* Customers Grid */}
        {!isLoading && !isError && data && data.customers.length > 0 && (
          <>
            <Grid gutter="md">
              {data.customers.map((customer) => (
                <Grid.Col
                  key={customer.id}
                  span={{ base: 12, sm: 6, md: 4, lg: 3 }}
                >
                  <CustomerCard
                    customer={customer}
                    onClick={() => handleCustomerClick(customer.id)}
                    showAppointmentCount
                  />
                </Grid.Col>
              ))}
            </Grid>

            {/* Pagination */}
            {data.totalPages > 1 && (
              <Center mt="xl">
                <Pagination
                  total={data.totalPages}
                  value={page}
                  onChange={handlePageChange}
                  size="md"
                  radius="xl"
                />
              </Center>
            )}

            {/* Results Summary */}
            <Center>
              <Text size="sm" c="dimmed">
                Mostrando {(page - 1) * limit + 1} -{" "}
                {Math.min(page * limit, data.total)} de {data.total} clientes
              </Text>
            </Center>
          </>
        )}
      </Stack>
    </Container>
  );
}

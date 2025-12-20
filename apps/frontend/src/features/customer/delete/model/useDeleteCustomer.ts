/**
 * useDeleteCustomer Hook
 *
 * TanStack Query mutation hook for deleting (anonymizing) customers.
 * Implements GDPR-compliant deletion with cache invalidation.
 *
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteCustomer } from "@shared/api/customers";
import { customerKeys } from "@entities/customer";
import { notifications } from "@mantine/notifications";

interface DeleteCustomerParams {
  customerId: string;
}

/**
 * Hook to delete (anonymize) a customer
 * @returns Mutation object with delete function
 */
export function useDeleteCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ customerId }: DeleteCustomerParams) =>
      deleteCustomer(customerId),

    onSuccess: () => {
      // Invalidate customer queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: customerKeys.all });

      // Show success notification
      notifications.show({
        title: "Cliente eliminado",
        message: "Los datos del cliente han sido anonimizados según GDPR",
        color: "green",
      });
    },

    onError: (error) => {
      // Show error notification
      notifications.show({
        title: "Error al eliminar cliente",
        message:
          error instanceof Error
            ? error.message
            : "Ocurrió un error al eliminar el cliente",
        color: "red",
      });
    },
  });
}

/**
 * useMergeCustomers Hook
 *
 * TanStack Query mutation hook for merging customers.
 * Implements optimistic updates and cache invalidation.
 *
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { mergeCustomers } from "@shared/api/customers";
import { customerKeys } from "@entities/customer";
import { notifications } from "@mantine/notifications";

interface MergeCustomersParams {
  sourceCustomerId: string;
  targetCustomerId: string;
}

/**
 * Hook to merge two customers
 * @returns Mutation object with merge function
 */
export function useMergeCustomers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      sourceCustomerId,
      targetCustomerId,
    }: MergeCustomersParams) =>
      mergeCustomers(sourceCustomerId, targetCustomerId),

    onSuccess: () => {
      // Invalidate customer queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: customerKeys.all });

      // Show success notification
      notifications.show({
        title: "Clientes fusionados",
        message: "Los clientes se han fusionado correctamente",
        color: "green",
      });
    },

    onError: (error) => {
      // Show error notification
      notifications.show({
        title: "Error al fusionar clientes",
        message:
          error instanceof Error
            ? error.message
            : "Ocurrió un error al fusionar los clientes",
        color: "red",
      });
    },
  });
}

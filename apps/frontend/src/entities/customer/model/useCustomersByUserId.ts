import { useQuery } from "@tanstack/react-query";
import type { CustomerReadModel } from "@packages/shared-types";
import { apiClient } from "@shared/api/client";
import { customerKeys } from "./useCustomer";

/**
 * Hook to fetch all customers linked to a specific user
 * Used for marketplace support where a user can be a customer in multiple businesses
 * @param userId - User ID
 * @returns Query result with array of customers
 */
export function useCustomersByUserId(userId: string) {
  return useQuery({
    queryKey: customerKeys.byUserId(userId),
    queryFn: async () => {
      const { data } = await apiClient.get<CustomerReadModel[]>(
        `/customers/by-user/${userId}`,
      );
      return data;
    },
    enabled: !!userId,
  });
}

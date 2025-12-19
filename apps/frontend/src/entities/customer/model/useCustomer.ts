import { useQuery } from '@tanstack/react-query';
import type { CustomerReadModel } from '@packages/shared-types';
import { apiClient } from '@shared/api/client';
import type { CustomerFilters } from './types';

/**
 * Query keys for customer queries
 * Follows TanStack Query best practices for key structure
 */
export const customerKeys = {
  all: ['customers'] as const,
  detail: (id: string) => [...customerKeys.all, 'detail', id] as const,
  list: (filters: CustomerFilters) => [...customerKeys.all, 'list', filters] as const,
  byUserId: (userId: string) => [...customerKeys.all, 'byUserId', userId] as const,
};

/**
 * Hook to fetch a single customer by ID
 * @param id - Customer ID
 * @returns Query result with customer data
 */
export function useCustomer(id: string) {
  return useQuery({
    queryKey: customerKeys.detail(id),
    queryFn: async () => {
      const { data } = await apiClient.get<CustomerReadModel>(`/customers/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

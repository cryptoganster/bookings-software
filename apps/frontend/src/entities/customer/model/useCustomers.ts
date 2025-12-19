import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@shared/api/client';
import { customerKeys } from './useCustomer';
import type { CustomerFilters, CustomerSearchResult } from './types';

/**
 * Hook to fetch customers with filters and pagination
 * Uses keepPreviousData to prevent loading states during pagination
 * @param filters - Customer filters
 * @returns Query result with paginated customer data
 */
export function useCustomers(filters: CustomerFilters = {}) {
  return useQuery({
    queryKey: customerKeys.list(filters),
    queryFn: async () => {
      const { data } = await apiClient.get<CustomerSearchResult>('/customers', {
        params: {
          searchText: filters.searchText,
          type: filters.type,
          dateRangeStart: filters.dateRange?.start?.toISOString(),
          dateRangeEnd: filters.dateRange?.end?.toISOString(),
          page: filters.page || 1,
          limit: filters.limit || 10,
          sortBy: filters.sortBy || 'createdAt',
          sortOrder: filters.sortOrder || 'desc',
        },
      });
      return data;
    },
    placeholderData: (previousData) => previousData, // Keep previous data during refetch
  });
}

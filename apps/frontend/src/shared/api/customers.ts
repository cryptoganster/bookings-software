import type { CustomerReadModel } from "@packages/shared-types";
import type {
  CustomerFilters,
  CustomerSearchResult,
  CustomerStats,
} from "@entities/customer/model/types";
import { apiClient } from "./client";
import { ENDPOINTS } from "./endpoints";

/**
 * Customer API Service
 *
 * Provides methods to interact with the Customer BC endpoints.
 * All methods use the configured apiClient with automatic auth token injection.
 */

/**
 * Get customer by ID
 */
export async function getCustomerById(id: string): Promise<CustomerReadModel> {
  const response = await apiClient.get<CustomerReadModel>(
    ENDPOINTS.CUSTOMERS.DETAIL(id),
  );
  return response.data;
}

/**
 * Search customers with filters and pagination
 */
export async function searchCustomers(
  filters: CustomerFilters,
): Promise<CustomerSearchResult> {
  const response = await apiClient.get<CustomerSearchResult>(
    ENDPOINTS.CUSTOMERS.SEARCH,
    {
      params: {
        searchText: filters.searchText,
        type: filters.type,
        startDate: filters.dateRange?.start.toISOString(),
        endDate: filters.dateRange?.end.toISOString(),
        page: filters.page,
        limit: filters.limit,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      },
    },
  );
  return response.data;
}

/**
 * Get customers by user ID (for registered customers)
 */
export async function getCustomersByUserId(
  userId: string,
): Promise<CustomerReadModel[]> {
  const response = await apiClient.get<CustomerReadModel[]>(
    ENDPOINTS.CUSTOMERS.BY_USER_ID(userId),
  );
  return response.data;
}

/**
 * Get customer statistics for the business
 */
export async function getCustomerStats(): Promise<CustomerStats> {
  const response = await apiClient.get<CustomerStats>(
    ENDPOINTS.CUSTOMERS.STATS,
  );
  return response.data;
}

/**
 * Merge two customers
 *
 * @param sourceCustomerId - Customer to merge from (will be marked as merged)
 * @param targetCustomerId - Customer to merge into (will receive all data)
 */
export async function mergeCustomers(
  sourceCustomerId: string,
  targetCustomerId: string,
): Promise<void> {
  await apiClient.post(ENDPOINTS.CUSTOMERS.MERGE, {
    sourceCustomerId,
    targetCustomerId,
  });
}

/**
 * Delete customer (GDPR compliance - anonymizes data)
 *
 * @param id - Customer ID to delete
 */
export async function deleteCustomer(id: string): Promise<void> {
  await apiClient.delete(ENDPOINTS.CUSTOMERS.DELETE(id));
}

/**
 * Export customer data (GDPR compliance)
 *
 * @param id - Customer ID to export
 * @returns Customer data with all related information (appointments, conversations)
 */
export async function exportCustomerData(id: string): Promise<Blob> {
  const response = await apiClient.get(ENDPOINTS.CUSTOMERS.EXPORT(id), {
    responseType: "blob",
  });
  return response.data;
}

/**
 * Duplicate customer pair for deduplication UI
 */
export interface DuplicateCustomerPair {
  customer1: CustomerReadModel;
  customer2: CustomerReadModel;
  similarityScore: number;
  reasons: string[];
}

/**
 * Detect duplicate customers
 *
 * @param threshold - Similarity threshold (0-1, default 0.8)
 * @returns List of potential duplicate pairs
 */
export async function detectDuplicateCustomers(
  threshold = 0.8,
): Promise<DuplicateCustomerPair[]> {
  const response = await apiClient.get<DuplicateCustomerPair[]>(
    ENDPOINTS.CUSTOMERS.DUPLICATES,
    {
      params: { threshold },
    },
  );
  return response.data;
}

/**
 * Customers API Service
 * Exported as a namespace for organized imports
 */
export const customersApi = {
  getById: getCustomerById,
  search: searchCustomers,
  getByUserId: getCustomersByUserId,
  getStats: getCustomerStats,
  merge: mergeCustomers,
  delete: deleteCustomer,
  exportData: exportCustomerData,
  detectDuplicates: detectDuplicateCustomers,
};

import type { CustomerReadModel } from '@packages/shared-types';

/**
 * Customer filters for search and list queries
 */
export interface CustomerFilters {
  searchText?: string;
  type?: 'anonymous' | 'registered' | 'all';
  dateRange?: {
    start: Date;
    end: Date;
  };
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'createdAt' | 'appointmentCount';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Customer search result with pagination
 */
export interface CustomerSearchResult {
  customers: CustomerReadModel[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Customer statistics
 */
export interface CustomerStats {
  totalCustomers: number;
  anonymousCount: number;
  registeredCount: number;
  newThisMonth: number;
  newThisWeek: number;
  topCustomers: Array<{
    customer: CustomerReadModel;
    appointmentCount: number;
  }>;
}

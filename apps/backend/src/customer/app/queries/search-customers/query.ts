import { Query } from '@nestjs/cqrs';

/**
 * Filters for searching customers
 */
export interface SearchCustomersFilters {
  businessId: string;
  searchText?: string;
  type?: 'anonymous' | 'registered' | 'all';
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'createdAt' | 'appointmentCount';
  sortOrder?: 'ASC' | 'DESC';
}

/**
 * Result of customer search
 */
export interface SearchCustomersResult {
  customers: Array<{
    id: string;
    userId: string | null;
    businessId: string;
    whatsappPhone: string;
    name: string | null;
    createdAt: Date;
    appointmentCount: number;
  }>;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Query to search customers with filters
 *
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
 */
export class SearchCustomersQuery extends Query<SearchCustomersResult> {
  constructor(public readonly filters: SearchCustomersFilters) {
    super();
  }
}

import { Query } from '@shared/kernel';

/**
 * Customer statistics for a business
 */
export interface CustomerStats {
  totalCustomers: number;
  anonymousCount: number;
  registeredCount: number;
  newThisMonth: number;
  newThisWeek: number;
  topCustomers: Array<{
    id: string;
    name: string | null;
    whatsappPhone: string;
    appointmentCount: number;
  }>;
}

/**
 * Query to get customer statistics for a business
 *
 * Requirements: 3.1
 */
export class GetCustomerStatsQuery extends Query<CustomerStats> {
  constructor(public readonly businessId: string) {
    super();
  }
}

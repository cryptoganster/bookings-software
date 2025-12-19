import { Query } from '@nestjs/cqrs';
import { CustomerReadModel } from '@customer/domain/read-models/customer';

/**
 * Represents a pair of potentially duplicate customers
 */
export interface DuplicateCustomerPair {
  customer1: CustomerReadModel;
  customer2: CustomerReadModel;
  similarityScore: number; // 0-1, where 1 is identical
  reasons: string[]; // e.g., ["Similar names", "Same phone digits"]
}

/**
 * Query to detect duplicate customers within a business
 * Uses similarity algorithms to find potential duplicates
 */
export class DetectDuplicateCustomersQuery extends Query<DuplicateCustomerPair[]> {
  constructor(
    public readonly businessId: string,
    public readonly threshold: number = 0.8, // Similarity threshold (0-1)
  ) {
    super();
  }
}

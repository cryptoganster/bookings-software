import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import {
  DetectDuplicateCustomersQuery,
  DuplicateCustomerPair,
} from '@customer/app/queries/detect-duplicate-customers/query';
import { ICustomerReadRepository } from '@customer/domain/interfaces/repositories';
import { CustomerDeduplicationService } from '@customer/domain/services/customer-deduplication.service';

/**
 * Handler for DetectDuplicateCustomersQuery
 *
 * Detects potential duplicate customers within a business using similarity algorithms.
 *
 * Algorithm:
 * 1. Load all customers for the business
 * 2. Use CustomerDeduplicationService to compare all pairs
 * 3. Return pairs with similarity score >= threshold
 * 4. Sort by similarity score (descending)
 *
 * Performance:
 * - O(n²) complexity for comparing all pairs
 * - Optimizations:
 *   - Skip customers without names (anonymous) for name comparison
 *   - Use phone number prefix grouping (future optimization)
 *   - Cache results for 1 hour (future optimization)
 *
 * **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**
 */
@QueryHandler(DetectDuplicateCustomersQuery)
export class DetectDuplicateCustomersHandler implements IQueryHandler<DetectDuplicateCustomersQuery> {
  constructor(
    @Inject('ICustomerReadRepository')
    private readonly readRepo: ICustomerReadRepository,
    private readonly deduplicationService: CustomerDeduplicationService,
  ) {}

  async execute(query: DetectDuplicateCustomersQuery): Promise<DuplicateCustomerPair[]> {
    // Load all customers for the business
    const customers = await this.readRepo.findByBusinessId(query.businessId);

    // If less than 2 customers, no duplicates possible
    if (customers.length < 2) {
      return [];
    }

    // Use deduplication service to detect duplicates
    const duplicates = this.deduplicationService.detectDuplicates(customers, query.threshold);

    return duplicates;
  }
}

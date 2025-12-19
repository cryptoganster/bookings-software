import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import {
  SearchCustomersQuery,
  SearchCustomersResult,
} from '@customer/app/queries/search-customers/query';
import { ICustomerReadRepository } from '@customer/domain/interfaces/repositories/customer-read';

/**
 * Handler for SearchCustomersQuery
 *
 * Uses TypeORM QueryBuilder with LIKE for text search
 * Escapes special characters (%, _, \) to prevent SQL injection
 * Implements pagination with OFFSET and LIMIT
 * Supports sorting by name, createdAt, appointmentCount
 *
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
 * Properties: 1 (Search consistency), 6 (Pagination consistency)
 * Edge Cases: 2 (SQL injection), 7 (Pagination beyond total), 9 (Empty query)
 */
@QueryHandler(SearchCustomersQuery)
export class SearchCustomersHandler implements IQueryHandler<SearchCustomersQuery> {
  constructor(
    @Inject('ICustomerReadRepository')
    private readonly customerReadRepository: ICustomerReadRepository,
  ) {}

  async execute(query: SearchCustomersQuery): Promise<SearchCustomersResult> {
    return this.customerReadRepository.search(query.filters);
  }
}

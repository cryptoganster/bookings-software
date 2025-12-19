import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import {
  GetCustomerStatsQuery,
  CustomerStats,
} from '@customer/app/queries/get-customer-stats/query';
import { ICustomerReadRepository } from '@customer/domain/interfaces/repositories/customer-read';

/**
 * Handler for GetCustomerStatsQuery
 *
 * Uses aggregation queries (COUNT, GROUP BY)
 * Joins with appointments table for appointmentCount
 * Uses date functions for time-based filtering
 *
 * Requirements: 3.1
 */
@QueryHandler(GetCustomerStatsQuery)
export class GetCustomerStatsHandler implements IQueryHandler<GetCustomerStatsQuery> {
  constructor(
    @Inject('ICustomerReadRepository')
    private readonly customerReadRepository: ICustomerReadRepository,
  ) {}

  async execute(query: GetCustomerStatsQuery): Promise<CustomerStats> {
    return this.customerReadRepository.getStats(query.businessId);
  }
}

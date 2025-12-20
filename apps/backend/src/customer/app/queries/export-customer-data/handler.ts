import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import {
  ExportCustomerDataQuery,
  CustomerDataExport,
} from '@customer/app/queries/export-customer-data/query';
import { ICustomerReadRepository } from '@customer/domain/interfaces/repositories/customer-read';

/**
 * Handler for ExportCustomerDataQuery
 *
 * Exports all customer data for GDPR compliance (right to data portability).
 * Returns customer information, appointments, and conversations in JSON format.
 *
 * Business Rules:
 * - Includes all personal data associated with the customer
 * - Dates formatted in ISO 8601
 * - Excludes internal system fields (version, IDs of related entities)
 * - Ready for download as JSON
 *
 * Validates: Requirements 7.1-7.5
 * Property 5: Export includes all customer data
 * Edge Case: 4 (customer with no data)
 */
@QueryHandler(ExportCustomerDataQuery)
export class ExportCustomerDataHandler implements IQueryHandler<ExportCustomerDataQuery> {
  constructor(
    @Inject('ICustomerReadRepository')
    private readonly customerReadRepository: ICustomerReadRepository,
  ) {}

  async execute(query: ExportCustomerDataQuery): Promise<CustomerDataExport> {
    // Load customer with all related data
    const customerData = await this.customerReadRepository.getFullData(query.customerId);

    return customerData;
  }
}

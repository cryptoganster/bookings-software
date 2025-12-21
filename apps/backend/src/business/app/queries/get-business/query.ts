import { Query } from '@nestjs/cqrs';
import { BusinessReadModel } from '@business/domain/read-models/business';

/**
 * GetBusinessQuery
 *
 * Query to retrieve a single business by ID
 * Returns BusinessReadModel for display
 *
 * Requirements: 10.4
 */
export class GetBusinessQuery extends Query<BusinessReadModel> {
  constructor(public readonly businessId: string) {
    super();
  }
}

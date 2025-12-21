import { Query } from '@nestjs/cqrs';
import { BusinessReadModel } from '@business/domain/read-models/business';

/**
 * GetBusinessesByOwnerIdQuery
 *
 * Query to retrieve all businesses owned by a user
 * Returns array of BusinessReadModel for display
 *
 * Requirements: 10.5
 */
export class GetBusinessesByOwnerIdQuery extends Query<BusinessReadModel[]> {
  constructor(public readonly ownerId: string) {
    super();
  }
}

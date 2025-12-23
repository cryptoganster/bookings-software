import { Query } from '@nestjs/cqrs';

/**
 * Query to get pending admin queries
 * TODO: Implement full query logic and return type
 */
export class GetPendingAdminQueriesQuery extends Query<unknown[]> {
  constructor(public readonly businessId: string) {
    super();
  }
}

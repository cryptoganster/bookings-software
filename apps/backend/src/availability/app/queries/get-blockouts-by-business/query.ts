import { Query } from '@nestjs/cqrs';

/**
 * Query to get blockouts by business
 * TODO: Implement full query logic and return type
 */
export class GetBlockoutsByBusinessQuery extends Query<any[]> {
  constructor(public readonly businessId: string) {
    super();
  }
}

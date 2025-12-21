import { IQuery } from '@nestjs/cqrs';

/**
 * GetBusinessOwnerQuery
 *
 * Query to retrieve a BusinessOwner by ID.
 *
 * Requirements: 9.4
 */
export class GetBusinessOwnerQuery implements IQuery {
  constructor(public readonly businessOwnerId: string) {}
}

import { IQuery } from '@nestjs/cqrs';

/**
 * GetBusinessOwnerByUserIdQuery
 *
 * Query to retrieve a BusinessOwner by userId.
 *
 * This is used by Business BC to validate BusinessOwner exists
 * and check onboarding status before creating a Business.
 *
 * Requirements: 9.5, 11.1
 */
export class GetBusinessOwnerByUserIdQuery implements IQuery {
  constructor(public readonly userId: string) {}
}

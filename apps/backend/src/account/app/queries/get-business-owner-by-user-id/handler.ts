import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetBusinessOwnerByUserIdQuery } from '@account/app/queries/get-business-owner-by-user-id/query';
import { BusinessOwnerReadModel } from '@account/domain/read_models/business-owner.read-model';
import { IBusinessOwnerReadRepository } from '@account/domain/interfaces/repositories/business-owner-read.interface';

/**
 * GetBusinessOwnerByUserIdHandler
 *
 * Handles retrieving a BusinessOwner by userId.
 *
 * This is used by Business BC to:
 * 1. Validate that BusinessOwner exists
 * 2. Check onboardingCompleted status
 * 3. Validate maxBusinesses limit
 *
 * Requirements: 9.5, 11.1
 */
@QueryHandler(GetBusinessOwnerByUserIdQuery)
export class GetBusinessOwnerByUserIdHandler implements IQueryHandler<GetBusinessOwnerByUserIdQuery> {
  constructor(
    @Inject('IBusinessOwnerReadRepository')
    private readonly readRepository: IBusinessOwnerReadRepository,
  ) {}

  async execute(query: GetBusinessOwnerByUserIdQuery): Promise<BusinessOwnerReadModel | null> {
    return this.readRepository.findByUserId(query.userId);
  }
}

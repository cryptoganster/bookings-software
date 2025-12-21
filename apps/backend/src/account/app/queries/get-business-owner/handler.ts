import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetBusinessOwnerQuery } from '@account/app/queries/get-business-owner/query';
import { BusinessOwnerReadModel } from '@account/domain/read_models/business-owner.read-model';
import { IBusinessOwnerReadRepository } from '@account/domain/interfaces/repositories/business-owner-read.interface';

/**
 * GetBusinessOwnerHandler
 *
 * Handles retrieving a BusinessOwner by ID.
 *
 * Uses ReadRepository for optimized read operations (CQRS read side).
 *
 * Requirements: 9.4
 */
@QueryHandler(GetBusinessOwnerQuery)
export class GetBusinessOwnerHandler implements IQueryHandler<GetBusinessOwnerQuery> {
  constructor(
    @Inject('IBusinessOwnerReadRepository')
    private readonly readRepository: IBusinessOwnerReadRepository,
  ) {}

  async execute(query: GetBusinessOwnerQuery): Promise<BusinessOwnerReadModel | null> {
    return this.readRepository.findById(query.businessOwnerId);
  }
}

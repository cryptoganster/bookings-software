import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetBusinessesByOwnerIdQuery } from '@business/app/queries/get-businesses-by-owner-id/query';
import { BusinessReadModel } from '@business/domain/read-models/business';
import { IBusinessReadRepository } from '@business/domain/interfaces/repositories/business-read';

/**
 * GetBusinessesByOwnerIdHandler
 *
 * Handles GetBusinessesByOwnerIdQuery to retrieve all businesses for a user
 * Uses read repository for optimized queries
 *
 * Requirements: 10.5
 */
@QueryHandler(GetBusinessesByOwnerIdQuery)
export class GetBusinessesByOwnerIdHandler implements IQueryHandler<GetBusinessesByOwnerIdQuery> {
  constructor(
    @Inject('IBusinessReadRepository')
    private readonly readRepository: IBusinessReadRepository,
  ) {}

  async execute(query: GetBusinessesByOwnerIdQuery): Promise<BusinessReadModel[]> {
    return this.readRepository.findByOwnerId(query.ownerId);
  }
}

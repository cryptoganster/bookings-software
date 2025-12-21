import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetBusinessQuery } from '@business/app/queries/get-business/query';
import { BusinessReadModel } from '@business/domain/read-models/business';
import { IBusinessReadRepository } from '@business/domain/interfaces/repositories/business-read';
import { BusinessNotFoundException } from '@business/domain/exceptions/business-not-found';

/**
 * GetBusinessHandler
 *
 * Handles GetBusinessQuery to retrieve a single business
 * Uses read repository for optimized queries
 *
 * Requirements: 10.4
 */
@QueryHandler(GetBusinessQuery)
export class GetBusinessHandler implements IQueryHandler<GetBusinessQuery> {
  constructor(
    @Inject('IBusinessReadRepository')
    private readonly readRepository: IBusinessReadRepository,
  ) {}

  async execute(query: GetBusinessQuery): Promise<BusinessReadModel> {
    const business = await this.readRepository.findById(query.businessId);

    if (!business) {
      throw new BusinessNotFoundException(query.businessId);
    }

    return business;
  }
}

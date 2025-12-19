import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetCustomersByUserIdQuery } from './query';
import { CustomerReadModel } from '../../../domain/read-models/customer';
import { ICustomerReadRepository } from '../../../domain/interfaces/repositories';

/**
 * GetCustomersByUserIdHandler
 * 
 * Retrieves all customers linked to a User
 * Returns empty array if no customers found
 */
@QueryHandler(GetCustomersByUserIdQuery)
export class GetCustomersByUserIdHandler
  implements IQueryHandler<GetCustomersByUserIdQuery>
{
  constructor(
    @Inject('ICustomerReadRepository')
    private readonly readRepo: ICustomerReadRepository,
  ) {}

  async execute(
    query: GetCustomersByUserIdQuery,
  ): Promise<CustomerReadModel[]> {
    return this.readRepo.findByUserId(query.userId);
  }
}

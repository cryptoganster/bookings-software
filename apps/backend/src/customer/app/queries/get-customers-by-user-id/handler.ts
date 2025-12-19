import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetCustomersByUserIdQuery } from '@customer/app/queries/get-customers-by-user-id/query';
import { CustomerReadModel } from '@customer/domain/read-models/customer';
import { ICustomerReadRepository } from '@customer/domain/interfaces/repositories';

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

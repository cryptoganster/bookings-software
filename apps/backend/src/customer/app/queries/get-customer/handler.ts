import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetCustomerQuery } from '@customer/app/queries/get-customer/query';
import { CustomerReadModel } from '@customer/domain/read-models/customer';
import { ICustomerReadRepository } from '@customer/domain/interfaces/repositories';

/**
 * GetCustomerHandler
 *
 * Retrieves a customer by ID
 * Uses Read Repository (CQRS read side)
 *
 * @throws CustomerNotFoundException if not found
 */
@QueryHandler(GetCustomerQuery)
export class GetCustomerHandler implements IQueryHandler<GetCustomerQuery> {
  constructor(
    @Inject('ICustomerReadRepository')
    private readonly readRepo: ICustomerReadRepository,
  ) {}

  async execute(query: GetCustomerQuery): Promise<CustomerReadModel> {
    return this.readRepo.findById(query.customerId);
  }
}

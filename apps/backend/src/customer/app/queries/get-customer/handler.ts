import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetCustomerQuery } from './query';
import { CustomerReadModel } from '../../../domain/read-models/customer';
import { ICustomerReadRepository } from '../../../domain/interfaces/repositories';

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

import { Query } from '@nestjs/cqrs';
import { CustomerReadModel } from '@customer/domain/read-models/customer';

/**
 * GetCustomerQuery
 *
 * Retrieves a customer by ID
 * Returns read model (DTO) for display
 *
 * @throws CustomerNotFoundException if not found
 */
export class GetCustomerQuery extends Query<CustomerReadModel> {
  constructor(public readonly customerId: string) {
    super();
  }
}

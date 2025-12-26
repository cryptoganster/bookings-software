import { Query } from '@shared/kernel';
import { CustomerReadModel } from '@customer/domain/read-models/customer';

/**
 * GetCustomersByUserIdQuery
 *
 * Retrieves all customers linked to a User
 * Marketplace support: one User can be customer in multiple businesses
 *
 * @returns empty array if no customers found
 */
export class GetCustomersByUserIdQuery extends Query<CustomerReadModel[]> {
  constructor(public readonly userId: string) {
    super();
  }
}

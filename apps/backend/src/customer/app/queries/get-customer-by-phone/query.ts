import { Query } from '@nestjs/cqrs';
import { CustomerReadModel } from '../../../domain/read-models/customer';

/**
 * GetCustomerByPhoneQuery
 * 
 * Retrieves a customer by WhatsApp phone within a business
 * Multi-tenant: unique per (businessId, whatsappPhone)
 * 
 * @returns null if not found (doesn't throw)
 */
export class GetCustomerByPhoneQuery extends Query<CustomerReadModel | null> {
  constructor(
    public readonly businessId: string,
    public readonly whatsappPhone: string,
  ) {
    super();
  }
}

import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetCustomerByPhoneQuery } from '@customer/app/queries/get-customer-by-phone/query';
import { CustomerReadModel } from '@customer/domain/read-models/customer';
import { ICustomerReadRepository } from '@customer/domain/interfaces/repositories';

/**
 * GetCustomerByPhoneHandler
 *
 * Retrieves a customer by WhatsApp phone within a business
 * Returns null if not found (doesn't throw)
 */
@QueryHandler(GetCustomerByPhoneQuery)
export class GetCustomerByPhoneHandler implements IQueryHandler<GetCustomerByPhoneQuery> {
  constructor(
    @Inject('ICustomerReadRepository')
    private readonly readRepo: ICustomerReadRepository,
  ) {}

  async execute(query: GetCustomerByPhoneQuery): Promise<CustomerReadModel | null> {
    return this.readRepo.findByWhatsAppPhone(query.businessId, query.whatsappPhone);
  }
}

import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetCustomerByPhoneQuery } from './query';
import { CustomerReadModel } from '../../../domain/read-models/customer';
import { ICustomerReadRepository } from '../../../domain/interfaces/repositories';

/**
 * GetCustomerByPhoneHandler
 * 
 * Retrieves a customer by WhatsApp phone within a business
 * Returns null if not found (doesn't throw)
 */
@QueryHandler(GetCustomerByPhoneQuery)
export class GetCustomerByPhoneHandler
  implements IQueryHandler<GetCustomerByPhoneQuery>
{
  constructor(
    @Inject('ICustomerReadRepository')
    private readonly readRepo: ICustomerReadRepository,
  ) {}

  async execute(
    query: GetCustomerByPhoneQuery,
  ): Promise<CustomerReadModel | null> {
    return this.readRepo.findByWhatsAppPhone(
      query.businessId,
      query.whatsappPhone,
    );
  }
}

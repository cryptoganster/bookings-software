import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetBusinessByWhatsAppPhoneQuery } from '@business/app/queries/get-business-by-whatsapp-phone/query';
import { BusinessReadModel } from '@business/domain/read-models/business';
import { IBusinessReadRepository } from '@business/domain/interfaces/repositories/business-read';

/**
 * GetBusinessByWhatsAppPhoneHandler
 *
 * Handles GetBusinessByWhatsAppPhoneQuery to find business by WhatsApp number
 * Used by Conversation BC to identify business from incoming messages
 * Returns null if business not found (not an error case)
 *
 * Requirements: 12.4
 */
@QueryHandler(GetBusinessByWhatsAppPhoneQuery)
export class GetBusinessByWhatsAppPhoneHandler implements IQueryHandler<GetBusinessByWhatsAppPhoneQuery> {
  constructor(
    @Inject('IBusinessReadRepository')
    private readonly readRepository: IBusinessReadRepository,
  ) {}

  async execute(query: GetBusinessByWhatsAppPhoneQuery): Promise<BusinessReadModel | null> {
    return this.readRepository.findByWhatsAppPhone(query.whatsappPhone);
  }
}

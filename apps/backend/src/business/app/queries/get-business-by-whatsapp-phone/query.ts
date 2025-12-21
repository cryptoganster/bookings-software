import { Query } from '@nestjs/cqrs';
import { BusinessReadModel } from '@business/domain/read-models/business';

/**
 * GetBusinessByWhatsAppPhoneQuery
 *
 * Query to retrieve a business by WhatsApp phone number
 * Used by Conversation BC to identify business from incoming messages
 * Returns BusinessReadModel or null if not found
 *
 * Requirements: 12.4
 */
export class GetBusinessByWhatsAppPhoneQuery extends Query<BusinessReadModel | null> {
  constructor(public readonly whatsappPhone: string) {
    super();
  }
}

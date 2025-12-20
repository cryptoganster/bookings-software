import { Query } from '@nestjs/cqrs';

/**
 * Customer Data Export structure (GDPR compliance)
 * Contains all personal data associated with a customer
 */
export interface CustomerDataExport {
  customer: {
    id: string;
    name: string | null;
    whatsappPhone: string;
    createdAt: string; // ISO 8601
    updatedAt: string; // ISO 8601
  };
  appointments: Array<{
    id: string;
    offeringName: string;
    dateTime: string; // ISO 8601
    status: string;
    createdAt: string; // ISO 8601
  }>;
  conversations: Array<{
    id: string;
    messages: Array<{
      content: string;
      direction: string; // INBOUND | OUTBOUND
      sentAt: string; // ISO 8601
    }>;
  }>;
}

/**
 * Query to export all customer data (GDPR compliance)
 * Returns customer information, appointments, and conversations
 */
export class ExportCustomerDataQuery extends Query<CustomerDataExport> {
  constructor(public readonly customerId: string) {
    super();
  }
}

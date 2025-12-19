import { Command } from '@nestjs/cqrs';

/**
 * Command to delete a customer (GDPR compliance)
 * Anonymizes customer data while preserving referential integrity
 */
export class DeleteCustomerCommand extends Command<void> {
  constructor(
    public readonly customerId: string,
    public readonly deletedBy: string, // userId of business owner
  ) {
    super();
  }
}

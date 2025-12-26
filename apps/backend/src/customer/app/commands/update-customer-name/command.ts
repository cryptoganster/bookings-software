import { Command } from '@shared/kernel';

/**
 * UpdateCustomerNameCommand
 *
 * Updates the name of an existing customer
 * Used when customer provides their name via WhatsApp or panel web
 */
export class UpdateCustomerNameCommand extends Command<void> {
  constructor(
    public readonly customerId: string,
    public readonly name: string,
  ) {
    super();
  }
}

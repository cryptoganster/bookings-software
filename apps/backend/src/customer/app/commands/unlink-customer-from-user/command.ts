import { Command } from '@nestjs/cqrs';

/**
 * UnlinkCustomerFromUserCommand
 * 
 * Unlinks a registered customer from their User
 * Converts customer back to anonymous (userId = null)
 * 
 * After unlinking:
 * - Customer loses access to panel web
 * - Customer only receives WhatsApp notifications
 * - Customer history is preserved
 * 
 * @see Property 9: Unlinking preserves customer identity
 * @throws CustomerNotLinkedToUserException if not linked
 */
export class UnlinkCustomerFromUserCommand extends Command<void> {
  constructor(public readonly customerId: string) {
    super();
  }
}

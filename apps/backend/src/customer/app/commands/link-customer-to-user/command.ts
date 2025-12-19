import { Command } from '@nestjs/cqrs';

/**
 * LinkCustomerToUserCommand
 *
 * Links an anonymous customer to a registered User
 * Used when customer registers in the platform (marketplace scenario)
 *
 * After linking:
 * - Customer can access panel web
 * - Customer receives email notifications
 * - Customer has full history
 *
 * @see Property 8: Linking preserves customer identity
 * @throws CustomerAlreadyLinkedToUserException if already linked
 */
export class LinkCustomerToUserCommand extends Command<void> {
  constructor(
    public readonly customerId: string,
    public readonly userId: string,
  ) {
    super();
  }
}

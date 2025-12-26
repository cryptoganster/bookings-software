import { Command } from '@shared/kernel';

/**
 * CreateBusinessCommand
 *
 * Command to create a new business.
 *
 * Requirements: 1.1-1.5, 2.1-2.5, 10.1, 11.1-11.5
 */
export class CreateBusinessCommand extends Command<{ businessId: string }> {
  constructor(
    public readonly ownerId: string, // User.id
    public readonly name: string,
    public readonly whatsappPhone: string,
    public readonly address: {
      street: string;
      city: string;
      state: string | null;
      country: string;
      postalCode: string | null;
    },
    public readonly timezone: string,
  ) {
    super();
  }
}

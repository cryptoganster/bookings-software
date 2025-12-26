import { Command } from '@shared/kernel';

/**
 * UpdateBusinessInfoCommand
 *
 * Command to update business information.
 *
 * Requirements: 10.2
 */
export class UpdateBusinessInfoCommand extends Command<void> {
  constructor(
    public readonly businessId: string,
    public readonly name: string,
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

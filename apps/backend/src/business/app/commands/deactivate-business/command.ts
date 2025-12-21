import { Command } from '@nestjs/cqrs';

/**
 * DeactivateBusinessCommand
 *
 * Command to deactivate a business.
 *
 * Requirements: 6.1, 6.3
 */
export class DeactivateBusinessCommand extends Command<void> {
  constructor(public readonly businessId: string) {
    super();
  }
}

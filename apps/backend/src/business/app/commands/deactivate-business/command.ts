import { Command } from '@shared/kernel';

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

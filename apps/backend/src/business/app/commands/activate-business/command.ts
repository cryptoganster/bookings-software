import { Command } from '@shared/kernel';

/**
 * ActivateBusinessCommand
 *
 * Command to activate a business.
 *
 * Requirements: 6.4, 6.5
 */
export class ActivateBusinessCommand extends Command<void> {
  constructor(public readonly businessId: string) {
    super();
  }
}

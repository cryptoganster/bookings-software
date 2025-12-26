import { Command } from '@shared/kernel';

export class DeactivateOfferingCommand extends Command<void> {
  constructor(
    public readonly offeringId: string,
    public readonly businessId: string,
  ) {
    super();
  }
}

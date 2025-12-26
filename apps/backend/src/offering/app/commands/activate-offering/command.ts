import { Command } from '@shared/kernel';

export class ActivateOfferingCommand extends Command<void> {
  constructor(
    public readonly offeringId: string,
    public readonly businessId: string,
  ) {
    super();
  }
}

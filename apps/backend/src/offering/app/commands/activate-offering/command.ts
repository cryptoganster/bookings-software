import { Command } from '@nestjs/cqrs';

export class ActivateOfferingCommand extends Command<void> {
  constructor(
    public readonly offeringId: string,
    public readonly businessId: string,
  ) {
    super();
  }
}

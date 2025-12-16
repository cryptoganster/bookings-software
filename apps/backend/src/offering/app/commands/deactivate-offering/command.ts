import { Command } from '@nestjs/cqrs';

export class DeactivateOfferingCommand extends Command<void> {
  constructor(
    public readonly offeringId: string,
    public readonly businessId: string,
  ) {
    super();
  }
}

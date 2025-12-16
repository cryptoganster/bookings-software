import { ICommand } from '@nestjs/cqrs';

export class CreateAppointmentCommand implements ICommand {
  constructor(
    public readonly businessId: string,
    public readonly customerId: string,
    public readonly offeringId: string,
    public readonly dateTime: Date,
  ) {}
}

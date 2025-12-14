import { ICommand } from '@nestjs/cqrs';

export class CancelAppointmentCommand implements ICommand {
  constructor(
    public readonly appointmentId: string,
    public readonly cancelledBy: string,
  ) {}
}

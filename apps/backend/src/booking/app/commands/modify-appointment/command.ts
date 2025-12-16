import { ICommand } from '@nestjs/cqrs';

export class ModifyAppointmentCommand implements ICommand {
  constructor(
    public readonly appointmentId: string,
    public readonly newDateTime: Date,
  ) {}
}

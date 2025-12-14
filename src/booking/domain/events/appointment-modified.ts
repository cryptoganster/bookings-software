export class AppointmentModified {
  constructor(
    public readonly appointmentId: string,
    public readonly newDateTime: Date,
    public readonly modifiedAt: Date = new Date(),
  ) {}
}

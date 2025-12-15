export class AppointmentCancelled {
  constructor(
    public readonly appointmentId: string,
    public readonly cancelledAt: Date = new Date(),
  ) {}
}

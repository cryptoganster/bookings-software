export class AppointmentCreated {
  constructor(
    public readonly appointmentId: string,
    public readonly businessId: string,
    public readonly customerId: string,
    public readonly offeringId: string,
    public readonly dateTime: Date,
    public readonly occurredAt: Date = new Date(),
  ) {}
}

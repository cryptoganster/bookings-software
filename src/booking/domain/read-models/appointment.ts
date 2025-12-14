export class AppointmentReadModel {
  id: string;
  businessId: string;
  customerId: string;
  customerName: string | null;
  customerPhone: string;
  offeringId: string;
  offeringName: string;
  dateTime: Date;
  status: string;
  createdAt: Date;
  cancelledAt: Date | null;
}

import { AppointmentReadModel } from '@booking/domain/read-models/appointment';

interface AppointmentRawModel {
  id: string;
  businessId: string;
  customerId: string;
  customerName?: string;
  customerPhone?: string;
  offeringId: string;
  offeringName?: string;
  dateTime: Date;
  status: string;
  createdAt: Date;
  cancelledAt?: Date | null;
}

export class AppointmentReadMapper {
  static toReadModel(model: AppointmentRawModel): AppointmentReadModel {
    return {
      id: model.id,
      businessId: model.businessId,
      customerId: model.customerId,
      customerName: model.customerName || null,
      customerPhone: model.customerPhone || '',
      offeringId: model.offeringId,
      offeringName: model.offeringName || '',
      dateTime: model.dateTime,
      status: model.status,
      createdAt: model.createdAt,
      cancelledAt: model.cancelledAt || null,
    };
  }
}

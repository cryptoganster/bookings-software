import { AppointmentReadModel } from '@booking/domain/read-models/appointment';

export class AppointmentReadMapper {
  static toReadModel(model: any): AppointmentReadModel {
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

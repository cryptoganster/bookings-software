import { CapacityModel } from '@booking/infra/persistence/models/capacity';
import { CapacityReadModel } from '../../../domain/read-models/capacity';

export class CapacityReadMapper {
  static toReadModel(model: CapacityModel): CapacityReadModel {
    return {
      id: model.id,
      offeringId: model.offeringId,
      date: model.date,
      totalSlots: model.totalSlots,
      availableSlots: model.availableSlots,
      bookedSlots: model.totalSlots - model.availableSlots,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    };
  }
}

import { OfferingReadModel } from '@offering/domain/read-models/offering';
import { OfferingModel } from '../models/offering';

export class OfferingReadMapper {
  static toReadModel(model: OfferingModel): OfferingReadModel {
    return {
      id: model.id,
      businessId: model.businessId,
      name: model.name,
      duration: model.duration,
      maxCapacityPerSlot: model.maxCapacityPerSlot,
      maxDailyCapacity: model.maxDailyCapacity,
      isActive: model.isActive,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    };
  }
}

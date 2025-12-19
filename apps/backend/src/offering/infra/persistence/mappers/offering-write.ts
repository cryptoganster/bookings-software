import { Offering } from '@offering/domain/aggregates/offering';
import { OfferingModel } from '@offering/infra/persistence/models/offering';
import { UUID } from '@shared/vo/uuid';
import { OfferingDuration } from '@offering/domain/vo/offering-duration';

export class OfferingWriteMapper {
  static toModel(offering: Offering): Partial<OfferingModel> {
    return {
      id: offering.getId().getValue(),
      businessId: offering.getBusinessId().getValue(),
      name: offering.getName(),
      duration: offering.getDuration().getMinutes(),
      maxCapacityPerSlot: offering.getMaxCapacityPerSlot(),
      maxDailyCapacity: offering.getMaxDailyCapacity(),
      isActive: offering.isActiveOffering(),
      version: offering.getVersion().getValue(),
    };
  }

  static toDomain(model: OfferingModel): Offering {
    return Offering.fromPersistence(
      UUID.fromString(model.id),
      UUID.fromString(model.businessId),
      model.name,
      OfferingDuration.fromMinutes(model.duration),
      model.maxCapacityPerSlot,
      model.maxDailyCapacity,
      model.isActive,
      model.version,
    );
  }
}

import { Business } from '@business/domain/aggregates/business';
import { BusinessModel } from '@business/infra/persistence/models/business.model';

/**
 * BusinessWriteMapper
 *
 * Maps Business aggregate to BusinessModel for persistence
 * Used by write repository
 *
 * Requirements: 9.1
 */
export class BusinessWriteMapper {
  /**
   * Maps Business aggregate to TypeORM model
   */
  static toModel(aggregate: Business): BusinessModel {
    const model = new BusinessModel();

    model.id = aggregate.getId().getValue();
    model.ownerId = aggregate.getOwnerId().getValue();
    model.name = aggregate.getName();
    model.whatsappPhone = aggregate.getWhatsAppPhone().getValue();

    const address = aggregate.getAddress().toObject();
    model.addressStreet = address.street;
    model.addressCity = address.city;
    model.addressState = address.state;
    model.addressCountry = address.country;
    model.addressPostalCode = address.postalCode;

    model.timezone = aggregate.getTimezone().getValue();
    model.isActive = aggregate.getIsActive();
    model.version = aggregate.getVersion().getValue();
    model.createdAt = aggregate.getCreatedAt();

    return model;
  }
}

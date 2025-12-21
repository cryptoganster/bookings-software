import { BusinessReadModel } from '@business/domain/read-models/business';
import { BusinessModel } from '@business/infra/persistence/models/business.model';

/**
 * BusinessReadMapper
 *
 * Maps BusinessModel to BusinessReadModel for queries
 * Used by read repository
 *
 * Requirements: 9.3
 */
export class BusinessReadMapper {
  /**
   * Maps TypeORM model to read model
   */
  static toReadModel(model: BusinessModel): BusinessReadModel {
    return {
      id: model.id,
      ownerId: model.ownerId,
      name: model.name,
      whatsappPhone: model.whatsappPhone,
      addressStreet: model.addressStreet,
      addressCity: model.addressCity,
      addressState: model.addressState,
      addressCountry: model.addressCountry || '',
      addressPostalCode: model.addressPostalCode,
      timezone: model.timezone,
      isActive: model.isActive,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
      version: model.version,
    };
  }
}

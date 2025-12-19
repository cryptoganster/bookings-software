import { CustomerReadModel } from '@customer/domain/read-models/customer';
import { CustomerModel } from '@customer/infra/persistence/models';

/**
 * CustomerReadMapper
 *
 * Maps CustomerModel to CustomerReadModel (DTO)
 * Used by Read Repository
 */
export class CustomerReadMapper {
  /**
   * Maps TypeORM model to read model (DTO)
   *
   * @param model - CustomerModel from database
   * @returns CustomerReadModel for queries
   */
  static toReadModel(model: CustomerModel): CustomerReadModel {
    return {
      id: model.id,
      userId: model.user_id,
      businessId: model.business_id,
      whatsappPhone: model.whatsapp_phone,
      name: model.name,
      createdAt: model.created_at,
      updatedAt: model.updated_at,
    };
  }
}

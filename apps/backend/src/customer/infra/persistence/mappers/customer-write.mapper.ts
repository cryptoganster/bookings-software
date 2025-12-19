import { Customer } from '@customer/domain/aggregates/customer';
import { CustomerModel } from '@customer/infra/persistence/models';

/**
 * CustomerWriteMapper
 *
 * Maps Customer aggregate to CustomerModel for persistence
 * Used by Write Repository
 */
export class CustomerWriteMapper {
  /**
   * Maps Customer aggregate to TypeORM model
   *
   * @param customer - Customer aggregate
   * @returns CustomerModel for persistence
   */
  static toModel(customer: Customer): CustomerModel {
    const model = new CustomerModel();

    model.id = customer.getId().getValue();
    model.user_id = customer.getUserId()?.getValue() ?? null;
    model.business_id = customer.getBusinessId().getValue();
    model.whatsapp_phone = customer.getWhatsAppPhone().getValue();
    model.name = customer.getName();
    model.version = customer.getVersion().getValue();
    model.created_at = customer.getCreatedAt();
    model.updated_at = customer.getUpdatedAt();

    return model;
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ICustomerFactory } from '@customer/domain/interfaces/factories';
import { Customer } from '@customer/domain/aggregates/customer';
import { CustomerModel } from '@customer/infra/persistence/models';
import { UUID } from '@shared/vo/uuid';
import { WhatsAppPhone } from '@shared/vo/whatsapp-phone';

/**
 * CustomerFactory
 *
 * Implements ICustomerFactory for loading Customer aggregates from persistence
 * Uses Factory Pattern to maintain CQRS strict separation
 *
 * @see ICustomerFactory
 * @see .kiro/steering/factory-pattern.md
 */
@Injectable()
export class CustomerFactory implements ICustomerFactory {
  constructor(
    @InjectRepository(CustomerModel)
    private readonly repository: Repository<CustomerModel>,
  ) {}

  /**
   * Loads a Customer aggregate by ID
   *
   * @param id - Customer UUID
   * @returns Customer aggregate with business logic, or null if not found
   */
  async loadById(id: string): Promise<Customer | null> {
    const model = await this.repository.findOne({ where: { id } });

    if (!model) {
      return null;
    }

    return this.reconstruct(model);
  }

  /**
   * Loads a Customer aggregate by WhatsApp phone and business
   *
   * @param businessId - Business UUID
   * @param whatsappPhone - WhatsApp phone in E.164 format
   * @returns Customer aggregate with business logic, or null if not found
   */
  async loadByWhatsAppPhone(businessId: string, whatsappPhone: string): Promise<Customer | null> {
    const model = await this.repository.findOne({
      where: {
        business_id: businessId,
        whatsapp_phone: whatsappPhone,
      },
    });

    if (!model) {
      return null;
    }

    return this.reconstruct(model);
  }

  /**
   * Reconstructs Customer aggregate from persistence model
   *
   * @param model - CustomerModel from database
   * @returns Customer aggregate with business logic and preserved version
   * @private
   */
  private reconstruct(model: CustomerModel): Customer {
    return Customer.fromPersistence(
      UUID.fromString(model.id),
      model.user_id ? UUID.fromString(model.user_id) : null,
      UUID.fromString(model.business_id),
      WhatsAppPhone.fromString(model.whatsapp_phone),
      model.name,
      model.version,
      model.created_at,
      model.updated_at,
    );
  }
}

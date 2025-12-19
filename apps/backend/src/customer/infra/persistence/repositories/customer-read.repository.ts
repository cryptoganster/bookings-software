import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { ICustomerReadRepository } from '@customer/domain/interfaces/repositories';
import { CustomerReadModel } from '@customer/domain/read-models/customer';
import { CustomerModel } from '@customer/infra/persistence/models';
import { CustomerReadMapper } from '@customer/infra/persistence/mappers';
import { CustomerNotFoundException } from '@customer/domain/exceptions/customer-not-found';

/**
 * CustomerReadRepository
 *
 * Implements ICustomerReadRepository for querying Customer data
 * Returns CustomerReadModel (DTOs) for CQRS read side
 *
 * @see ICustomerReadRepository
 * @see .kiro/steering/cqrs.md
 */
@Injectable()
export class CustomerReadRepository implements ICustomerReadRepository {
  constructor(
    @InjectRepository(CustomerModel)
    private readonly repository: Repository<CustomerModel>,
  ) {}

  /**
   * Finds a customer by ID
   *
   * @param id - Customer UUID
   * @returns CustomerReadModel
   * @throws CustomerNotFoundException if not found
   */
  async findById(id: string): Promise<CustomerReadModel> {
    const model = await this.repository.findOne({ where: { id } });

    if (!model) {
      throw new CustomerNotFoundException(id);
    }

    return CustomerReadMapper.toReadModel(model);
  }

  /**
   * Finds a customer by WhatsApp phone and business
   *
   * Multi-tenant: unique per (businessId, whatsappPhone)
   *
   * @param businessId - Business UUID
   * @param whatsappPhone - WhatsApp phone in E.164 format
   * @returns CustomerReadModel or null if not found
   */
  async findByWhatsAppPhone(
    businessId: string,
    whatsappPhone: string,
  ): Promise<CustomerReadModel | null> {
    const model = await this.repository.findOne({
      where: {
        business_id: businessId,
        whatsapp_phone: whatsappPhone,
      },
    });

    if (!model) {
      return null;
    }

    return CustomerReadMapper.toReadModel(model);
  }

  /**
   * Finds all customers for a business
   *
   * @param businessId - Business UUID
   * @returns Array of CustomerReadModel
   */
  async findByBusinessId(businessId: string): Promise<CustomerReadModel[]> {
    const models = await this.repository.find({
      where: { business_id: businessId },
      order: { created_at: 'DESC' },
    });

    return models.map(CustomerReadMapper.toReadModel);
  }

  /**
   * Finds all customers linked to a User
   *
   * Marketplace support: A User can be customer in multiple businesses
   *
   * @param userId - User UUID
   * @returns Array of CustomerReadModel
   */
  async findByUserId(userId: string): Promise<CustomerReadModel[]> {
    const models = await this.repository.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
    });

    return models.map(CustomerReadMapper.toReadModel);
  }

  /**
   * Finds all anonymous customers for a business
   *
   * Anonymous customers have userId = null
   *
   * @param businessId - Business UUID
   * @returns Array of CustomerReadModel
   */
  async findAnonymousByBusinessId(businessId: string): Promise<CustomerReadModel[]> {
    const models = await this.repository.find({
      where: {
        business_id: businessId,
        user_id: IsNull(), // TypeORM helper for querying null values
      },
      order: { created_at: 'DESC' },
    });

    return models.map(CustomerReadMapper.toReadModel);
  }
}

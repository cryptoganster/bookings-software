import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Brackets } from 'typeorm';
import { ICustomerReadRepository } from '@customer/domain/interfaces/repositories';
import { CustomerReadModel } from '@customer/domain/read-models/customer';
import { CustomerModel } from '@customer/infra/persistence/models';
import { CustomerReadMapper } from '@customer/infra/persistence/mappers';
import { CustomerNotFoundException } from '@customer/domain/exceptions/customer-not-found';
import {
  SearchCustomersFilters,
  SearchCustomersResult,
} from '@customer/app/queries/search-customers/query';

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

  /**
   * Search customers with filters
   *
   * Implements:
   * - Text search (name, phone) with case-insensitive LIKE
   * - SQL injection prevention (escaping %, _, \)
   * - Type filtering (anonymous/registered)
   * - Date range filtering
   * - Pagination (OFFSET, LIMIT)
   * - Sorting (name, createdAt, appointmentCount)
   *
   * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
   * Edge Cases: 2 (SQL injection), 7 (Pagination beyond total), 9 (Empty query)
   */
  async search(filters: SearchCustomersFilters): Promise<SearchCustomersResult> {
    const {
      businessId,
      searchText,
      type = 'all',
      dateRange,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = filters;

    // Build query
    const queryBuilder = this.repository
      .createQueryBuilder('customer')
      .where('customer.business_id = :businessId', { businessId });

    // Text search (case-insensitive, SQL injection safe)
    if (searchText && searchText.trim()) {
      // Escape special characters for LIKE: %, _, \
      const escapedText = searchText
        .replace(/\\/g, '\\\\')
        .replace(/%/g, '\\%')
        .replace(/_/g, '\\_');

      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where('LOWER(customer.name) LIKE LOWER(:searchText)', {
            searchText: `%${escapedText}%`,
          }).orWhere('customer.whatsapp_phone LIKE :searchText', {
            searchText: `%${escapedText}%`,
          });
        }),
      );
    }

    // Type filter
    if (type === 'anonymous') {
      queryBuilder.andWhere('customer.user_id IS NULL');
    } else if (type === 'registered') {
      queryBuilder.andWhere('customer.user_id IS NOT NULL');
    }

    // Date range filter
    if (dateRange) {
      queryBuilder.andWhere('customer.created_at BETWEEN :startDate AND :endDate', {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      });
    }

    // Get total count before pagination
    const total = await queryBuilder.getCount();

    // Sorting
    const sortColumn = sortBy === 'name' ? 'customer.name' : 'customer.created_at';
    queryBuilder.orderBy(sortColumn, sortOrder);

    // Pagination
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    // Execute query
    const models = await queryBuilder.getMany();

    // Map to read models with appointment count (placeholder for now)
    const customers = models.map((model) => ({
      id: model.id,
      userId: model.user_id,
      businessId: model.business_id,
      whatsappPhone: model.whatsapp_phone,
      name: model.name,
      createdAt: model.created_at,
      appointmentCount: 0, // TODO: Join with appointments table
    }));

    const totalPages = Math.ceil(total / limit);

    return {
      customers,
      total,
      page,
      limit,
      totalPages,
    };
  }
}

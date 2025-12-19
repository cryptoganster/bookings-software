import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ICustomerWriteRepository } from '@customer/domain/interfaces/repositories';
import { Customer } from '@customer/domain/aggregates/customer';
import { CustomerModel } from '@customer/infra/persistence/models';
import { CustomerWriteMapper } from '@customer/infra/persistence/mappers';
import { ConcurrencyException } from '@shared/kernel/exceptions/concurrency';

/**
 * CustomerWriteRepository
 *
 * Implements ICustomerWriteRepository for persisting Customer aggregates
 * Uses Optimistic Locking with version field
 *
 * @see ICustomerWriteRepository
 * @see .kiro/steering/ddd-patterns.md
 */
@Injectable()
export class CustomerWriteRepository implements ICustomerWriteRepository {
  constructor(
    @InjectRepository(CustomerModel)
    private readonly repository: Repository<CustomerModel>,
  ) {}

  /**
   * Persists a Customer aggregate
   *
   * Uses Optimistic Locking:
   * - Updates only if version matches
   * - Throws ConcurrencyException if version mismatch
   * - Increments version on successful update
   *
   * @param customer - Customer aggregate to persist
   * @throws ConcurrencyException if aggregate was modified by another transaction
   */
  async save(customer: Customer): Promise<void> {
    const model = CustomerWriteMapper.toModel(customer);
    const currentVersion = customer.getVersion().getValue();
    const newVersion = currentVersion + 1;

    // Check if customer exists
    const existing = await this.repository.findOne({
      where: { id: model.id },
    });

    if (!existing) {
      // Insert new customer
      await this.repository.save({
        ...model,
        version: newVersion,
      });
      return;
    }

    // Update existing customer with optimistic locking
    const result = await this.repository
      .createQueryBuilder()
      .update(CustomerModel)
      .set({
        user_id: model.user_id,
        business_id: model.business_id,
        whatsapp_phone: model.whatsapp_phone,
        name: model.name,
        version: newVersion,
        updated_at: model.updated_at,
      })
      .where('id = :id', { id: model.id })
      .andWhere('version = :version', { version: currentVersion })
      .execute();

    if (result.affected === 0) {
      throw new ConcurrencyException(`Customer ${model.id} was modified by another transaction`);
    }
  }
}

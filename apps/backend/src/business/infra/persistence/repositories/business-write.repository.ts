import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IBusinessWriteRepository } from '@business/domain/interfaces/repositories/business-write';
import { Business } from '@business/domain/aggregates/business';
import { BusinessModel } from '@business/infra/persistence/models/business.model';
import { BusinessWriteMapper } from '@business/infra/persistence/mappers/business-write.mapper';
import { IUnitOfWork } from '@shared/kernel/uow';
import { ConcurrencyException } from '@shared/kernel/exceptions/concurrency';

/**
 * BusinessWriteRepository
 *
 * Implements IBusinessWriteRepository for persisting Business aggregates
 * Uses Optimistic Locking with version field
 * Throws ConcurrencyException on version conflict
 *
 * Requirements: 9.1, 9.4, 9.5
 */
@Injectable()
export class BusinessWriteRepository implements IBusinessWriteRepository {
  constructor(
    @InjectRepository(BusinessModel)
    private readonly repository: Repository<BusinessModel>,
    @Inject('IUnitOfWork')
    private readonly uow: IUnitOfWork,
  ) {}

  /**
   * Saves a Business aggregate with optimistic locking
   * Verifies no concurrent modifications using version field
   *
   * @param business Business aggregate to save
   * @throws ConcurrencyException if version conflict detected
   */
  async save(business: Business): Promise<void> {
    await this.uow.transaction(async () => {
      const model = BusinessWriteMapper.toModel(business);
      const currentVersion = business.getVersion().getValue();

      // Check if business exists
      const existing = await this.repository.findOne({
        where: { id: model.id },
      });

      if (!existing) {
        // Insert new business with current version from aggregate
        await this.repository.save(model);
        return;
      }

      // For updates, the aggregate should have already incremented its version
      // We need to check against the previous version (currentVersion - 1)
      const previousVersion = currentVersion - 1;

      // Update existing business with optimistic locking
      const result = await this.repository
        .createQueryBuilder()
        .update(BusinessModel)
        .set({
          ownerId: model.ownerId,
          name: model.name,
          whatsappPhone: model.whatsappPhone,
          addressStreet: model.addressStreet,
          addressCity: model.addressCity,
          addressState: model.addressState,
          addressCountry: model.addressCountry,
          addressPostalCode: model.addressPostalCode,
          timezone: model.timezone,
          isActive: model.isActive,
          version: currentVersion, // Save the new version from aggregate
          updatedAt: model.updatedAt,
        })
        .where('id = :id', { id: model.id })
        .andWhere('version = :version', { version: previousVersion }) // Check against previous version
        .execute();

      if (result.affected === 0) {
        throw new ConcurrencyException(
          `Business ${business.getId().getValue()} was modified by another transaction`,
        );
      }
    });
  }
}

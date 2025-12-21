import { Injectable } from '@nestjs/common';
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
    private readonly uow: IUnitOfWork,
  ) {}

  /**
   * Saves a Business aggregate with optimistic locking
   * Increments version and verifies no concurrent modifications
   *
   * @param business Business aggregate to save
   * @throws ConcurrencyException if version conflict detected
   */
  async save(business: Business): Promise<void> {
    await this.uow.transaction(async () => {
      const model = BusinessWriteMapper.toModel(business);
      const currentVersion = business.getVersion().getValue();
      const newVersion = currentVersion + 1;

      // Check if business exists
      const existing = await this.repository.findOne({
        where: { id: model.id },
      });

      if (!existing) {
        // New business - insert
        model.version = newVersion;
        await this.repository.save(model);
      } else {
        // Existing business - update with optimistic locking
        const result = await this.repository
          .createQueryBuilder()
          .update(BusinessModel)
          .set({
            ...model,
            version: newVersion,
          })
          .where('id = :id', { id: model.id })
          .andWhere('version = :version', { version: currentVersion })
          .execute();

        if (result.affected === 0) {
          throw new ConcurrencyException(
            `Business ${business.getId().getValue()} was modified by another transaction`,
          );
        }
      }
    });
  }
}

import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IBusinessOwnerWriteRepository } from '@account/domain/interfaces/repositories/business-owner-write.interface';
import { BusinessOwner } from '@account/domain/aggregates/business-owner';
import { BusinessOwnerModel } from '@account/infra/persistence/models/business-owner.model';
import { BusinessOwnerWriteMapper } from '@account/infra/persistence/mappers/business-owner-write.mapper';
import { IUnitOfWork } from '@shared/kernel/uow';
import { ConcurrencyException } from '@shared/kernel/exceptions/concurrency';

@Injectable()
export class BusinessOwnerWriteRepository implements IBusinessOwnerWriteRepository {
  constructor(
    @InjectRepository(BusinessOwnerModel)
    private readonly repository: Repository<BusinessOwnerModel>,
    @Inject('IUnitOfWork')
    private readonly uow: IUnitOfWork,
  ) {}

  async save(businessOwner: BusinessOwner): Promise<void> {
    await this.uow.transaction(async () => {
      const model = BusinessOwnerWriteMapper.toModel(businessOwner);
      const id = businessOwner.getId().getValue();
      const currentVersion = businessOwner.getVersion().getValue();

      // Check if entity exists
      const existing = await this.repository.findOne({ where: { id } });

      if (!existing) {
        // Insert new entity
        await this.repository.save(model);
      } else {
        // Update existing entity with optimistic locking
        // Check against the OLD version (before increment in domain method)
        const oldVersion = currentVersion - 1;
        const result = await this.repository
          .createQueryBuilder()
          .update(BusinessOwnerModel)
          .set({
            userId: model.userId,
            subscriptionPlan: model.subscriptionPlan,
            subscriptionStatus: model.subscriptionStatus,
            onboardingCompleted: model.onboardingCompleted,
            version: currentVersion, // Set to current (already incremented in domain)
            updatedAt: new Date(),
          })
          .where('id = :id', { id })
          .andWhere('version = :version', { version: oldVersion }) // Check against old version
          .execute();

        if (result.affected === 0) {
          throw new ConcurrencyException(`BusinessOwner ${id} was modified by another transaction`);
        }
      }
    });
  }
}

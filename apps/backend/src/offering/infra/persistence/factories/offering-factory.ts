import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IOfferingFactory } from '@offering/domain/interfaces/factories/offering-factory';
import { Offering } from '@offering/domain/aggregates/offering';
import { OfferingModel } from '../models/offering';
import { UUID } from '@shared/vo/uuid';
import { OfferingDuration } from '@offering/domain/vo/offering-duration';

/**
 * Factory implementation for loading Offering aggregates from persistence
 *
 * This factory reconstructs Offering aggregates with their business logic
 * and version for optimistic locking, enabling command handlers to modify them.
 */
@Injectable()
export class OfferingFactory implements IOfferingFactory {
  constructor(
    @InjectRepository(OfferingModel)
    private readonly repository: Repository<OfferingModel>,
  ) {}

  async loadById(id: string): Promise<Offering | null> {
    const model = await this.repository.findOne({
      where: { id },
    });

    if (!model) {
      return null;
    }

    return this.reconstructAggregate(model);
  }

  async loadByBusinessIdAndName(businessId: string, name: string): Promise<Offering | null> {
    const model = await this.repository.findOne({
      where: {
        businessId,
        name,
      },
    });

    if (!model) {
      return null;
    }

    return this.reconstructAggregate(model);
  }

  /**
   * Reconstructs an Offering aggregate from persistence model
   * Preserves version for optimistic locking
   */
  private reconstructAggregate(model: OfferingModel): Offering {
    return Offering.fromPersistence(
      UUID.fromString(model.id),
      UUID.fromString(model.businessId),
      model.name,
      OfferingDuration.fromMinutes(model.duration),
      model.maxCapacityPerSlot,
      model.maxDailyCapacity,
      model.isActive,
      model.version,
    );
  }
}

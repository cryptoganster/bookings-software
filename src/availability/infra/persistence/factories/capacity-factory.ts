import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ICapacityFactory } from '@availability/domain/interfaces/factories/capacity-factory';
import { CapacityModel } from '../models/capacity';
import { Capacity } from '@availability/domain/aggregates/capacity';
import { UUID } from '@shared/vo/uuid';

/**
 * Infrastructure implementation of ICapacityFactory
 *
 * This factory loads domain aggregates from the database for modification.
 * It reconstructs the aggregate with all its business logic.
 *
 * Located in infrastructure because it depends on TypeORM and database models.
 */
@Injectable()
export class CapacityFactory implements ICapacityFactory {
  constructor(
    @InjectRepository(CapacityModel)
    private readonly repository: Repository<CapacityModel>,
  ) {}

  async loadByOfferingAndDate(offeringId: string, date: Date): Promise<Capacity | null> {
    const model = await this.repository.findOne({
      where: {
        offeringId,
        date,
      },
    });

    if (!model) {
      return null;
    }

    return Capacity.fromPersistence(
      UUID.fromString(model.id),
      UUID.fromString(model.offeringId),
      model.date,
      model.totalSlots,
      model.availableSlots,
      model.totalSlots - model.availableSlots, // bookedSlots
      model.version,
    );
  }

  async loadById(id: string): Promise<Capacity | null> {
    const model = await this.repository.findOne({
      where: { id },
    });

    if (!model) {
      return null;
    }

    return Capacity.fromPersistence(
      UUID.fromString(model.id),
      UUID.fromString(model.offeringId),
      model.date,
      model.totalSlots,
      model.availableSlots,
      model.totalSlots - model.availableSlots, // bookedSlots
      model.version,
    );
  }
}

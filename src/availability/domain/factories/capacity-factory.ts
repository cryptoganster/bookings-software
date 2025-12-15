import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ICapacityFactory } from '../interfaces/factories/capacity-factory';
import { CapacityModel } from '@availability/infra/persistence/models/capacity';

/**
 * Factory implementation for loading Capacity aggregates
 * 
 * This factory loads domain aggregates from the database for modification.
 * It reconstructs the aggregate with all its business logic.
 */
@Injectable()
export class CapacityFactory implements ICapacityFactory {
  constructor(
    @InjectRepository(CapacityModel)
    private readonly repository: Repository<CapacityModel>,
  ) {}

  async loadByOfferingAndDate(offeringId: string, date: Date): Promise<any> {
    const model = await this.repository.findOne({
      where: {
        offeringId,
        date,
      },
    });

    if (!model) {
      return null;
    }

    // TODO: When Capacity aggregate is implemented, use:
    // return Capacity.fromPersistence(model.id, model.offeringId, model.date, ...);
    
    // Temporary mock object with business logic
    return {
      id: model.id,
      offeringId: model.offeringId,
      date: model.date,
      totalSlots: model.totalSlots,
      availableSlots: model.availableSlots,
      version: model.version,
      hasAvailableSlots: () => model.availableSlots > 0,
      decrementSlot: function() {
        this.availableSlots--;
      },
    };
  }

  async loadById(id: string): Promise<any> {
    const model = await this.repository.findOne({
      where: { id },
    });

    if (!model) {
      return null;
    }

    // TODO: When Capacity aggregate is implemented, use:
    // return Capacity.fromPersistence(model.id, model.offeringId, model.date, ...);
    
    // Temporary mock object with business logic
    return {
      id: model.id,
      offeringId: model.offeringId,
      date: model.date,
      totalSlots: model.totalSlots,
      availableSlots: model.availableSlots,
      version: model.version,
      hasAvailableSlots: () => model.availableSlots > 0,
      decrementSlot: function() {
        this.availableSlots--;
      },
    };
  }
}

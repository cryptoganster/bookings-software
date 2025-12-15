import { CapacityModel } from '@availability/infra/persistence/models/capacity';

/**
 * Write Mapper for Capacity Aggregate
 * 
 * TODO: Update this mapper once Capacity aggregate is implemented
 * Currently works with a simple object structure
 */
export class CapacityWriteMapper {
  /**
   * Maps a Capacity aggregate (or object) to a TypeORM model for persistence
   * 
   * @param capacity The capacity aggregate/object to map
   * @returns Partial CapacityModel for database persistence
   */
  static toModel(capacity: any): Partial<CapacityModel> {
    return {
      id: capacity.id,
      offeringId: capacity.offeringId,
      date: capacity.date,
      totalSlots: capacity.totalSlots,
      availableSlots: capacity.availableSlots,
      version: capacity.version,
    };
  }

  /**
   * Maps a TypeORM model to a Capacity aggregate
   * 
   * TODO: Implement proper aggregate reconstruction once Capacity aggregate exists
   * 
   * @param model The TypeORM model from database
   * @returns Capacity aggregate
   */
  static toDomain(model: CapacityModel): any {
    return {
      id: model.id,
      offeringId: model.offeringId,
      date: model.date,
      totalSlots: model.totalSlots,
      availableSlots: model.availableSlots,
      version: model.version,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    };
  }
}

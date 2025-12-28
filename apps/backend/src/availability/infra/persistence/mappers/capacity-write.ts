import { CapacityModel } from '@availability/infra/persistence/models/capacity';
import { Capacity } from '@availability/domain/aggregates/capacity';
import { UUID } from '@shared/vo/uuid';

/**
 * Write Mapper for Capacity Aggregate
 *
 * Converts between Capacity aggregate and CapacityModel (TypeORM entity)
 */
export class CapacityWriteMapper {
  /**
   * Maps a Capacity aggregate to a TypeORM model for persistence
   *
   * @param capacity The capacity aggregate to map
   * @returns Partial CapacityModel for database persistence
   */
  static toModel(capacity: Capacity): Partial<CapacityModel> {
    // Convert Date to YYYY-MM-DD string for PostgreSQL DATE column
    // This prevents timezone conversion issues
    const date = capacity.getDate();
    const normalizedDate = new Date(date);
    normalizedDate.setUTCHours(0, 0, 0, 0);
    const dateStr = normalizedDate.toISOString().split('T')[0];

    return {
      id: capacity.getId().getValue(),
      offeringId: capacity.getOfferingId().getValue(),
      date: dateStr as any, // TypeORM will accept string for DATE column
      totalSlots: capacity.getTotalSlots(),
      availableSlots: capacity.getAvailableSlots(),
      version: capacity.getVersion().getValue(),
    };
  }

  /**
   * Maps a TypeORM model to a Capacity aggregate
   *
   * Note: In clean CQRS/DDD, write repositories typically don't need toDomain()
   * because aggregates are loaded via factories, not repositories.
   * This method is here for completeness but may not be used.
   *
   * @param model The TypeORM model from database
   * @returns Capacity aggregate
   */
  static toDomain(model: CapacityModel): Capacity {
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

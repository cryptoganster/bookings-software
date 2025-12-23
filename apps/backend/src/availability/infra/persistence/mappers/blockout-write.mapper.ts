import { Blockout } from '@availability/domain/aggregates/blockout';
import { BlockoutModel } from '@availability/infra/persistence/models/blockout';
import { UUID } from '@shared/vo/uuid';
import { DateRange } from '@availability/domain/vo/date-range.vo';

export class BlockoutWriteMapper {
  /**
   * Maps a Blockout aggregate to a BlockoutModel for persistence
   */
  static toModel(blockout: Blockout): BlockoutModel {
    const model = new BlockoutModel();
    model.id = blockout.getId().getValue();
    model.businessId = blockout.getBusinessId().getValue();
    model.startDate = blockout.getDateRange().getStartDate();
    model.endDate = blockout.getDateRange().getEndDate();
    model.reason = blockout.getReason();
    return model;
  }

  /**
   * Maps a BlockoutModel to a Blockout aggregate
   *
   * Note: In clean CQRS/DDD, write repositories typically don't need toDomain()
   * because aggregates are loaded via factories, not repositories.
   * This method is here for completeness and testing purposes.
   *
   * @param model The TypeORM model from database
   * @returns Blockout aggregate
   */
  static toDomain(model: BlockoutModel): Blockout {
    return Blockout.fromPersistence(
      UUID.fromString(model.id),
      UUID.fromString(model.businessId),
      DateRange.create(model.startDate, model.endDate),
      model.reason,
    );
  }
}

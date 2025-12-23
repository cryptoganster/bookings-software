import { Blockout } from '@availability/domain/aggregates/blockout';
import { BlockoutModel } from '@availability/infra/persistence/models/blockout';

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
}

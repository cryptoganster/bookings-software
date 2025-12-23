import { BlockoutReadModel } from '@availability/domain/read-models/blockout';
import { BlockoutModel } from '@availability/infra/persistence/models/blockout';

export class BlockoutReadMapper {
  /**
   * Maps a BlockoutModel to a BlockoutReadModel for queries
   */
  static toReadModel(model: BlockoutModel): BlockoutReadModel {
    return {
      id: model.id,
      businessId: model.businessId,
      startDate: model.startDate,
      endDate: model.endDate,
      reason: model.reason,
      createdAt: model.createdAt,
    };
  }
}

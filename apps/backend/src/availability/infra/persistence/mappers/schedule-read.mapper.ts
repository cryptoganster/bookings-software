import { ScheduleReadModel } from '@availability/domain/read-models/schedule';
import { ScheduleModel } from '@availability/infra/persistence/models/schedule';

export class ScheduleReadMapper {
  /**
   * Maps a ScheduleModel to a ScheduleReadModel for queries
   */
  static toReadModel(model: ScheduleModel): ScheduleReadModel {
    return {
      id: model.id,
      businessId: model.businessId,
      dayOfWeek: model.dayOfWeek,
      startTime: model.startTime,
      endTime: model.endTime,
      isActive: model.isActive,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    };
  }
}

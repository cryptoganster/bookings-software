import { Schedule } from '@availability/domain/aggregates/schedule';
import { ScheduleModel } from '@availability/infra/persistence/models/schedule';

export class ScheduleWriteMapper {
  /**
   * Maps a Schedule aggregate to a ScheduleModel for persistence
   */
  static toModel(schedule: Schedule): ScheduleModel {
    const model = new ScheduleModel();
    model.id = schedule.getId().getValue();
    model.businessId = schedule.getBusinessId().getValue();
    model.dayOfWeek = schedule.getDayOfWeek().getValue();
    model.startTime = schedule.getTimeSlot().getStartTime();
    model.endTime = schedule.getTimeSlot().getEndTime();
    model.isActive = schedule.getIsActive();
    return model;
  }
}

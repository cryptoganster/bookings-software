import { Schedule } from '@availability/domain/aggregates/schedule';
import { ScheduleModel } from '@availability/infra/persistence/models/schedule';
import { UUID } from '@shared/vo/uuid';
import { TimeSlot } from '@availability/domain/vo/time-slot.vo';
import { DayOfWeek } from '@availability/domain/vo/day-of-week.vo';

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

  /**
   * Maps a ScheduleModel to a Schedule aggregate
   *
   * Note: In clean CQRS/DDD, write repositories typically don't need toDomain()
   * because aggregates are loaded via factories, not repositories.
   * This method is here for completeness and testing purposes.
   *
   * @param model The TypeORM model from database
   * @returns Schedule aggregate
   */
  static toDomain(model: ScheduleModel): Schedule {
    return Schedule.fromPersistence(
      UUID.fromString(model.id),
      UUID.fromString(model.businessId),
      DayOfWeek.create(model.dayOfWeek),
      TimeSlot.create(model.startTime, model.endTime),
      model.isActive,
    );
  }
}

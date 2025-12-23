import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IScheduleFactory } from '@availability/domain/interfaces/factories/schedule-factory';
import { ScheduleModel } from '@availability/infra/persistence/models/schedule';
import { Schedule } from '@availability/domain/aggregates/schedule';
import { UUID } from '@shared/vo/uuid';
import { DayOfWeek } from '@availability/domain/vo/day-of-week.vo';
import { TimeSlot } from '@availability/domain/vo/time-slot.vo';

/**
 * Infrastructure implementation of IScheduleFactory
 *
 * This factory loads domain aggregates from the database for modification.
 * It reconstructs the aggregate with all its business logic.
 *
 * Located in infrastructure because it depends on TypeORM and database models.
 */
@Injectable()
export class ScheduleFactory implements IScheduleFactory {
  constructor(
    @InjectRepository(ScheduleModel)
    private readonly repository: Repository<ScheduleModel>,
  ) {}

  async loadById(id: string): Promise<Schedule | null> {
    const model = await this.repository.findOne({
      where: { id },
    });

    if (!model) {
      return null;
    }

    return Schedule.fromPersistence(
      UUID.fromString(model.id),
      UUID.fromString(model.businessId),
      DayOfWeek.create(model.dayOfWeek),
      TimeSlot.create(model.startTime, model.endTime),
      model.isActive,
    );
  }

  async loadByBusinessAndDay(businessId: string, dayOfWeek: number): Promise<Schedule | null> {
    const model = await this.repository.findOne({
      where: { businessId, dayOfWeek },
    });

    if (!model) {
      return null;
    }

    return Schedule.fromPersistence(
      UUID.fromString(model.id),
      UUID.fromString(model.businessId),
      DayOfWeek.create(model.dayOfWeek),
      TimeSlot.create(model.startTime, model.endTime),
      model.isActive,
    );
  }
}

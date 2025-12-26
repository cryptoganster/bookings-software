import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ScheduleModel } from '@availability/infra/persistence/models/schedule';
import { IScheduleReadRepository } from '@availability/domain/interfaces/repositories/schedule-read';
import { ScheduleReadMapper } from '@availability/infra/persistence/mappers/schedule-read.mapper';
import { ScheduleReadModel } from '@availability/domain/read-models/schedule';

@Injectable()
export class ScheduleReadRepository implements IScheduleReadRepository {
  constructor(
    @InjectRepository(ScheduleModel)
    private readonly repository: Repository<ScheduleModel>,
  ) {}

  async findById(scheduleId: string): Promise<ScheduleReadModel | null> {
    const model = await this.repository.findOne({
      where: { id: scheduleId },
    });

    if (!model) {
      return null;
    }

    return ScheduleReadMapper.toReadModel(model);
  }

  async findByBusinessId(businessId: string): Promise<ScheduleReadModel[]> {
    const models = await this.repository.find({
      where: { businessId },
      order: { dayOfWeek: 'ASC', startTime: 'ASC' },
    });

    return models.map((model) => ScheduleReadMapper.toReadModel(model));
  }

  async findByBusinessAndDay(
    businessId: string,
    dayOfWeek: number,
  ): Promise<ScheduleReadModel | null> {
    const model = await this.repository.findOne({
      where: { businessId, dayOfWeek },
    });

    if (!model) {
      return null;
    }

    return ScheduleReadMapper.toReadModel(model);
  }
}

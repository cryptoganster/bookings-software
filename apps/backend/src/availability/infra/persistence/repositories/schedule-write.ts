import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ScheduleModel } from '@availability/infra/persistence/models/schedule';
import { IScheduleWriteRepository } from '@availability/domain/interfaces/repositories/schedule-write';
import { ScheduleWriteMapper } from '@availability/infra/persistence/mappers/schedule-write.mapper';
import { Schedule } from '@availability/domain/aggregates/schedule';

@Injectable()
export class ScheduleWriteRepository implements IScheduleWriteRepository {
  constructor(
    @InjectRepository(ScheduleModel)
    private readonly repository: Repository<ScheduleModel>,
  ) {}

  async save(schedule: Schedule): Promise<void> {
    const model = ScheduleWriteMapper.toModel(schedule);
    await this.repository.save(model);
  }

  async delete(scheduleId: string): Promise<void> {
    await this.repository.delete({ id: scheduleId });
  }
}

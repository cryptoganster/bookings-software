import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IAppointmentReadRepository } from '@booking/domain/interfaces/repositories/appointment-read';
import { AppointmentReadModel } from '@booking/domain/read-models/appointment';
import { AppointmentModel } from '../models/appointment';
import { AppointmentReadMapper } from '../mappers/appointment-read';

@Injectable()
export class AppointmentReadRepository implements IAppointmentReadRepository {
  constructor(
    @InjectRepository(AppointmentModel)
    private readonly repository: Repository<AppointmentModel>,
  ) {}

  async findById(id: string): Promise<AppointmentReadModel | null> {
    const model = await this.repository.findOne({
      where: { id },
    });

    if (!model) return null;

    return AppointmentReadMapper.toReadModel(model);
  }

  async findByCustomerId(customerId: string): Promise<AppointmentReadModel[]> {
    const models = await this.repository.find({
      where: { customerId },
      order: { dateTime: 'ASC' },
    });

    return models.map((model) => AppointmentReadMapper.toReadModel(model));
  }

  async findByBusinessId(businessId: string): Promise<AppointmentReadModel[]> {
    const models = await this.repository.find({
      where: { businessId },
      order: { dateTime: 'ASC' },
    });

    return models.map((model) => AppointmentReadMapper.toReadModel(model));
  }

  async findUpcoming(businessId: string): Promise<AppointmentReadModel[]> {
    const now = new Date();
    const models = await this.repository
      .createQueryBuilder('appointment')
      .where('appointment.businessId = :businessId', { businessId })
      .andWhere('appointment.dateTime >= :now', { now })
      .andWhere('appointment.status != :cancelled', { cancelled: 'CANCELLED' })
      .orderBy('appointment.dateTime', 'ASC')
      .getMany();

    return models.map((model) => AppointmentReadMapper.toReadModel(model));
  }
}

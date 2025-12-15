import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CapacityModel } from '@availability/infra/persistence/models/capacity';
import { ICapacityReadRepository } from '@availability/domain/interfaces/repositories/capacity-read';
import { CapacityReadModel } from '@availability/domain/read-models/capacity';
import { CapacityReadMapper } from '@availability/infra/persistence/mappers/capacity-read';

@Injectable()
export class CapacityReadRepository implements ICapacityReadRepository {
  constructor(
    @InjectRepository(CapacityModel)
    private readonly repository: Repository<CapacityModel>,
  ) {}

  async findByOfferingAndDateRange(
    offeringId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<CapacityReadModel[]> {
    const capacities = await this.repository
      .createQueryBuilder('capacity')
      .where('capacity.offeringId = :offeringId', { offeringId })
      .andWhere('capacity.date >= :startDate', { startDate })
      .andWhere('capacity.date <= :endDate', { endDate })
      .andWhere('capacity.availableSlots > 0')
      .orderBy('capacity.date', 'ASC')
      .getMany();

    return capacities.map(CapacityReadMapper.toReadModel);
  }

  async findByOfferingAndDate(offeringId: string, date: Date): Promise<CapacityReadModel | null> {
    const capacity = await this.repository.findOne({
      where: {
        offeringId,
        date,
      },
    });

    if (!capacity) {
      return null;
    }

    return CapacityReadMapper.toReadModel(capacity);
  }
}

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
    // Normalize date to midnight UTC for comparison (only date part, no time)
    const normalizedDate = new Date(date);
    normalizedDate.setUTCHours(0, 0, 0, 0);

    // Format date as YYYY-MM-DD string for PostgreSQL DATE comparison
    // This ensures consistent comparison regardless of timezone
    const dateStr = normalizedDate.toISOString().split('T')[0];

    // Use QueryBuilder with date string for consistent comparison
    const capacity = await this.repository
      .createQueryBuilder('capacity')
      .where('capacity.offeringId = :offeringId', { offeringId })
      .andWhere('capacity.date = :date', { date: dateStr })
      .getOne();

    if (!capacity) {
      return null;
    }

    return CapacityReadMapper.toReadModel(capacity);
  }
}

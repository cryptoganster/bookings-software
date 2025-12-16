import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OfferingModel } from '@offering/infra/persistence/models/offering';
import { IOfferingReadRepository } from '@offering/domain/interfaces/repositories/offering-read';
import { OfferingReadModel } from '@offering/domain/read-models/offering';
import { OfferingReadMapper } from '@offering/infra/persistence/mappers/offering-read';

@Injectable()
export class OfferingReadRepository implements IOfferingReadRepository {
  constructor(
    @InjectRepository(OfferingModel)
    private readonly repository: Repository<OfferingModel>,
  ) {}

  async findById(id: string): Promise<OfferingReadModel | null> {
    const offering = await this.repository.findOne({
      where: { id },
    });

    if (!offering) {
      return null;
    }

    return OfferingReadMapper.toReadModel(offering);
  }

  async findByBusinessId(businessId: string): Promise<OfferingReadModel[]> {
    const offerings = await this.repository.find({
      where: { businessId },
      order: { name: 'ASC' },
    });

    return offerings.map(OfferingReadMapper.toReadModel);
  }

  async findActiveByBusinessId(businessId: string): Promise<OfferingReadModel[]> {
    const offerings = await this.repository.find({
      where: {
        businessId,
        isActive: true,
      },
      order: { name: 'ASC' },
    });

    return offerings.map(OfferingReadMapper.toReadModel);
  }
}

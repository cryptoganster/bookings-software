import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IBusinessOwnerReadRepository } from '@account/domain/interfaces/repositories/business-owner-read.interface';
import { BusinessOwnerReadModel } from '@account/domain/read_models/business-owner.read-model';
import { BusinessOwnerModel } from '@account/infra/persistence/models/business-owner.model';
import { BusinessOwnerReadMapper } from '@account/infra/persistence/mappers/business-owner-read.mapper';

@Injectable()
export class BusinessOwnerReadRepository implements IBusinessOwnerReadRepository {
  constructor(
    @InjectRepository(BusinessOwnerModel)
    private readonly repository: Repository<BusinessOwnerModel>,
  ) {}

  async findById(id: string): Promise<BusinessOwnerReadModel | null> {
    const model = await this.repository.findOne({ where: { id } });

    if (!model) {
      return null;
    }

    return BusinessOwnerReadMapper.toReadModel(model);
  }

  async findByUserId(userId: string): Promise<BusinessOwnerReadModel | null> {
    const model = await this.repository.findOne({ where: { userId } });

    if (!model) {
      return null;
    }

    return BusinessOwnerReadMapper.toReadModel(model);
  }
}

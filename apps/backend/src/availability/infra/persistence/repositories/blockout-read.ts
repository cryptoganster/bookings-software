import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { BlockoutModel } from '@availability/infra/persistence/models/blockout';
import { IBlockoutReadRepository } from '@availability/domain/interfaces/repositories/blockout-read';
import { BlockoutReadMapper } from '@availability/infra/persistence/mappers/blockout-read.mapper';
import { BlockoutReadModel } from '@availability/domain/read-models/blockout';

@Injectable()
export class BlockoutReadRepository implements IBlockoutReadRepository {
  constructor(
    @InjectRepository(BlockoutModel)
    private readonly repository: Repository<BlockoutModel>,
  ) {}

  async findById(blockoutId: string): Promise<BlockoutReadModel | null> {
    const model = await this.repository.findOne({
      where: { id: blockoutId },
    });

    if (!model) {
      return null;
    }

    return BlockoutReadMapper.toReadModel(model);
  }

  async findByBusinessId(businessId: string): Promise<BlockoutReadModel[]> {
    const models = await this.repository.find({
      where: { businessId },
      order: { startDate: 'ASC' },
    });

    return models.map((model) => BlockoutReadMapper.toReadModel(model));
  }

  async findByBusinessAndDateRange(
    businessId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<BlockoutReadModel[]> {
    // Find blockouts that overlap with the given date range
    // A blockout overlaps if:
    // - blockout.startDate <= endDate AND blockout.endDate >= startDate
    const models = await this.repository.find({
      where: {
        businessId,
        startDate: LessThanOrEqual(endDate),
        endDate: MoreThanOrEqual(startDate),
      },
      order: { startDate: 'ASC' },
    });

    return models.map((model) => BlockoutReadMapper.toReadModel(model));
  }
}

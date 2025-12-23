import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BlockoutModel } from '@availability/infra/persistence/models/blockout';
import { IBlockoutWriteRepository } from '@availability/domain/interfaces/repositories/blockout-write';
import { BlockoutWriteMapper } from '@availability/infra/persistence/mappers/blockout-write.mapper';
import { Blockout } from '@availability/domain/aggregates/blockout';

@Injectable()
export class BlockoutWriteRepository implements IBlockoutWriteRepository {
  constructor(
    @InjectRepository(BlockoutModel)
    private readonly repository: Repository<BlockoutModel>,
  ) {}

  async save(blockout: Blockout): Promise<void> {
    const model = BlockoutWriteMapper.toModel(blockout);
    await this.repository.save(model);
  }

  async delete(blockoutId: string): Promise<void> {
    await this.repository.delete({ id: blockoutId });
  }
}

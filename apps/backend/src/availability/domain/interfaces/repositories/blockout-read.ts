import { BlockoutReadModel } from '@availability/domain/read-models/blockout';

export interface IBlockoutReadRepository {
  findById(blockoutId: string): Promise<BlockoutReadModel | null>;
  findByBusinessId(businessId: string): Promise<BlockoutReadModel[]>;
  findByBusinessAndDateRange(
    businessId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<BlockoutReadModel[]>;
}

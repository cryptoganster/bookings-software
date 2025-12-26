import { Blockout } from '@availability/domain/aggregates/blockout';

export interface IBlockoutWriteRepository {
  save(blockout: Blockout): Promise<void>;
  delete(blockoutId: string): Promise<void>;
}

import { Blockout } from '@availability/domain/aggregates/blockout';

export interface IBlockoutFactory {
  loadById(blockoutId: string): Promise<Blockout | null>;
}

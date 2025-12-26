import { Query } from '@shared/kernel';
import { BlockoutReadModel } from '@availability/domain/read-models/blockout';

export class GetBlockoutsByBusinessQuery extends Query<BlockoutReadModel[]> {
  constructor(public readonly businessId: string) {
    super();
  }
}

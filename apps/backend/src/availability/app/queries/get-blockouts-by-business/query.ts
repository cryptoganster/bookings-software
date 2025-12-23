import { Query } from '@nestjs/cqrs';
import { BlockoutReadModel } from '@availability/domain/read-models/blockout';

export class GetBlockoutsByBusinessQuery extends Query<BlockoutReadModel[]> {
  constructor(public readonly businessId: string) {
    super();
  }
}

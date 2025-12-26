import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetBlockoutsByBusinessQuery } from '@availability/app/queries/get-blockouts-by-business/query';
import { BlockoutReadModel } from '@availability/domain/read-models/blockout';
import { IBlockoutReadRepository } from '@availability/domain/interfaces/repositories/blockout-read';

@QueryHandler(GetBlockoutsByBusinessQuery)
export class GetBlockoutsByBusinessHandler implements IQueryHandler<GetBlockoutsByBusinessQuery> {
  constructor(
    @Inject('IBlockoutReadRepository')
    private readonly blockoutReadRepository: IBlockoutReadRepository,
  ) {}

  async execute(query: GetBlockoutsByBusinessQuery): Promise<BlockoutReadModel[]> {
    return this.blockoutReadRepository.findByBusinessId(query.businessId);
  }
}

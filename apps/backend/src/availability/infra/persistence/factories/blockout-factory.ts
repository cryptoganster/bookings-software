import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IBlockoutFactory } from '@availability/domain/interfaces/factories/blockout-factory';
import { BlockoutModel } from '@availability/infra/persistence/models/blockout';
import { Blockout } from '@availability/domain/aggregates/blockout';
import { UUID } from '@shared/vo/uuid';
import { DateRange } from '@availability/domain/vo/date-range.vo';

/**
 * Infrastructure implementation of IBlockoutFactory
 *
 * This factory loads domain aggregates from the database for modification.
 * It reconstructs the aggregate with all its business logic.
 *
 * Located in infrastructure because it depends on TypeORM and database models.
 */
@Injectable()
export class BlockoutFactory implements IBlockoutFactory {
  constructor(
    @InjectRepository(BlockoutModel)
    private readonly repository: Repository<BlockoutModel>,
  ) {}

  async loadById(id: string): Promise<Blockout | null> {
    const model = await this.repository.findOne({
      where: { id },
    });

    if (!model) {
      return null;
    }

    // Ensure dates are Date objects (TypeORM might return strings)
    const startDate = model.startDate instanceof Date ? model.startDate : new Date(model.startDate);
    const endDate = model.endDate instanceof Date ? model.endDate : new Date(model.endDate);

    return Blockout.fromPersistence(
      UUID.fromString(model.id),
      UUID.fromString(model.businessId),
      DateRange.fromPersistence(startDate, endDate), // Use fromPersistence to skip validation
      model.reason,
    );
  }
}

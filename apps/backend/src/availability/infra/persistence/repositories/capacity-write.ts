import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CapacityModel } from '@availability/infra/persistence/models/capacity';
import { ICapacityWriteRepository } from '@availability/domain/interfaces/repositories/capacity-write';
import { CapacityWriteMapper } from '@availability/infra/persistence/mappers/capacity-write';
import { ConcurrencyException } from '@shared/kernel/exceptions/concurrency';
import { Capacity } from '@availability/domain/aggregates/capacity';

@Injectable()
export class CapacityWriteRepository implements ICapacityWriteRepository {
  constructor(
    @InjectRepository(CapacityModel)
    private readonly repository: Repository<CapacityModel>,
  ) {}

  async save(capacity: Capacity): Promise<void> {
    const model = CapacityWriteMapper.toModel(capacity);

    // Check if capacity already exists
    const existing = await this.repository.findOne({
      where: { id: capacity.getId().getValue() },
    });

    if (!existing) {
      // Insert new capacity
      await this.repository.save(model);
      return;
    }

    // Intenta actualizar solo si la versión coincide (Optimistic Locking)
    // Note: The aggregate already incremented the version, so we check against version - 1
    const previousVersion = capacity.getVersion().getValue() - 1;
    const result = await this.repository
      .createQueryBuilder()
      .update(CapacityModel)
      .set({
        ...model,
        version: capacity.getVersion().getValue(), // Use the already incremented version
      })
      .where('id = :id', { id: capacity.getId().getValue() })
      .andWhere('version = :version', {
        version: previousVersion, // Check against previous version
      })
      .execute();

    // Si no se actualizó ninguna fila, significa que la versión cambió
    if (result.affected === 0) {
      throw new ConcurrencyException(
        `Capacity ${capacity.getId().getValue()} was modified by another transaction`,
      );
    }
  }
}

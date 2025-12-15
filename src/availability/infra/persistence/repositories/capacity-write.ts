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

    // Intenta actualizar solo si la versión coincide (Optimistic Locking)
    const result = await this.repository
      .createQueryBuilder()
      .update(CapacityModel)
      .set({
        ...model,
        version: capacity.getVersion().getValue() + 1, // Nueva versión
      })
      .where('id = :id', { id: capacity.getId().getValue() })
      .andWhere('version = :version', {
        version: capacity.getVersion().getValue(), // Versión actual
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

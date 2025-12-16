import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IOfferingWriteRepository } from '@offering/domain/interfaces/repositories/offering-write';
import { Offering } from '@offering/domain/aggregates/offering';
import { OfferingModel } from '../models/offering';
import { OfferingWriteMapper } from '../mappers/offering-write';
import { ConcurrencyException } from '@shared/kernel/exceptions/concurrency';
import { IUnitOfWork } from '@shared/kernel/uow';
import { UUID } from '@shared/vo/uuid';

@Injectable()
export class OfferingWriteRepository implements IOfferingWriteRepository {
  constructor(
    @InjectRepository(OfferingModel)
    private readonly repository: Repository<OfferingModel>,
    @Inject('IUnitOfWork')
    private readonly uow: IUnitOfWork,
  ) {}

  async save(offering: Offering): Promise<void> {
    await this.uow.transaction(async () => {
      const model = OfferingWriteMapper.toModel(offering);
      const currentVersion = offering.getVersion().getValue();
      const offeringId = offering.getId().getValue();

      // Verificar si el offering ya existe
      const existing = await this.repository.findOne({
        where: { id: offeringId },
      });

      if (!existing) {
        // Es un nuevo offering, hacer INSERT
        await this.repository.insert({
          ...model,
          version: currentVersion,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as OfferingModel);
      } else {
        // Es un offering existente, hacer UPDATE con optimistic locking
        // El aggregate ya incrementó la versión, así que la versión en BD debe ser currentVersion - 1
        const dbVersion = currentVersion - 1;
        const result = await this.repository
          .createQueryBuilder()
          .update(OfferingModel)
          .set({
            ...model,
            version: currentVersion, // Nueva versión (ya incrementada por el aggregate)
            updatedAt: new Date(),
          })
          .where('id = :id', { id: offeringId })
          .andWhere('version = :version', {
            version: dbVersion, // Versión que debe estar en BD
          })
          .execute();

        // Si no se actualizó ninguna fila, significa que hubo concurrencia
        if (result.affected === 0) {
          throw new ConcurrencyException(
            `Offering ${offeringId} was modified by another transaction`,
          );
        }
      }
    });
  }

  async findById(id: UUID): Promise<Offering | null> {
    const model = await this.repository.findOne({
      where: { id: id.getValue() },
    });

    if (!model) return null;

    return OfferingWriteMapper.toDomain(model);
  }

  async findByBusinessIdAndName(businessId: UUID, name: string): Promise<Offering | null> {
    const model = await this.repository.findOne({
      where: {
        businessId: businessId.getValue(),
        name,
      },
    });

    if (!model) return null;

    return OfferingWriteMapper.toDomain(model);
  }
}

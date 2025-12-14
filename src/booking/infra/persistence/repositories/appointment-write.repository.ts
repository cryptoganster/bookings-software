import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IAppointmentWriteRepository } from '@booking/domain/interfaces/repositories/appointment-write.repository';
import { Appointment } from '@booking/domain/aggregates/appointment';
import { AppointmentModel } from '../models/appointment';
import { AppointmentWriteMapper } from '../mappers/appointment-write';
import { ConcurrencyException } from '@shared/kernel/exceptions/concurrency';
import { IUnitOfWork } from '@shared/kernel/uow';
import { UUID } from '@shared/vo/uuid';

@Injectable()
export class AppointmentWriteRepository implements IAppointmentWriteRepository {
  constructor(
    @InjectRepository(AppointmentModel)
    private readonly repository: Repository<AppointmentModel>,
    @Inject('IUnitOfWork')
    private readonly uow: IUnitOfWork,
  ) {}

  async save(appointment: Appointment): Promise<void> {
    await this.uow.transaction(async () => {
      const model = AppointmentWriteMapper.toModel(appointment);
      const currentVersion = appointment.getVersion().getValue();

      // Intenta actualizar solo si la versión coincide
      const result = await this.repository
        .createQueryBuilder()
        .update(AppointmentModel)
        .set({
          ...model,
          version: currentVersion + 1, // Nueva versión
        })
        .where('id = :id', { id: appointment.getId().getValue() })
        .andWhere('version = :version', {
          version: currentVersion, // Versión actual
        })
        .execute();

      // Si no se actualizó ninguna fila, significa que la versión cambió
      if (result.affected === 0) {
        // Intentar insertar si no existe
        try {
          await this.repository.insert({
            ...model,
            version: currentVersion,
          } as AppointmentModel);
        } catch (error) {
          // Si falla el insert, es porque hubo concurrencia
          throw new ConcurrencyException(
            `Appointment ${appointment.getId().getValue()} was modified by another transaction`,
          );
        }
      }
    });
  }

  async findById(id: UUID): Promise<Appointment | null> {
    const model = await this.repository.findOne({
      where: { id: id.getValue() },
    });

    if (!model) return null;

    return AppointmentWriteMapper.toDomain(model);
  }
}

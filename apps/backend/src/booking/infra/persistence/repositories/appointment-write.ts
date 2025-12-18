import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IAppointmentWriteRepository } from '@booking/domain/interfaces/repositories/appointment-write';
import { Appointment } from '@booking/domain/aggregates/appointment';
import { AppointmentModel } from '../models/appointment';
import { AppointmentWriteMapper } from '../mappers/appointment-write';
import { ConcurrencyException } from '@shared/kernel/exceptions/concurrency';
import { IUnitOfWork } from '@shared/kernel/uow';

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
      const appointmentId = appointment.getId().getValue();

      // Verificar si el appointment ya existe
      const existing = await this.repository.findOne({
        where: { id: appointmentId },
      });

      if (!existing) {
        // Es un nuevo appointment, hacer INSERT
        await this.repository.insert({
          ...model,
          version: currentVersion,
          createdAt: new Date(),
          updatedAt: new Date(),
          cancelledAt: null,
        } as AppointmentModel);
      } else {
        // Es un appointment existente, hacer UPDATE con optimistic locking
        // El aggregate ya incrementó la versión, así que:
        // - currentVersion es la NUEVA versión (después del incremento)
        // - loadedVersion es la versión que tenía cuando se cargó desde BD
        const loadedVersion = appointment.getLoadedVersion().getValue();

        const result = await this.repository
          .createQueryBuilder()
          .update(AppointmentModel)
          .set({
            ...model,
            version: currentVersion, // Nueva versión (ya incrementada por el aggregate)
            updatedAt: new Date(),
          })
          .where('id = :id', { id: appointmentId })
          .andWhere('version = :version', {
            version: loadedVersion, // Versión cargada (NO re-leer desde BD)
          })
          .execute();

        // Si no se actualizó ninguna fila, significa que hubo concurrencia
        if (result.affected === 0) {
          throw new ConcurrencyException(
            `Appointment ${appointmentId} was modified by another transaction. ` +
              `Expected version ${loadedVersion}, but database has a different version.`,
          );
        }
      }
    });
  }

  // ❌ NO implementar métodos de lectura
  // Write repository solo debe persistir aggregates
  // Para cargar aggregates, usar IAppointmentFactory
}

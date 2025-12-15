import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IAppointmentWriteRepository } from '@booking/domain/interfaces/repositories/appointment-write';
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
        const result = await this.repository
          .createQueryBuilder()
          .update(AppointmentModel)
          .set({
            ...model,
            version: currentVersion + 1, // Nueva versión
            updatedAt: new Date(),
          })
          .where('id = :id', { id: appointmentId })
          .andWhere('version = :version', {
            version: currentVersion, // Versión actual
          })
          .execute();

        // Si no se actualizó ninguna fila, significa que hubo concurrencia
        if (result.affected === 0) {
          throw new ConcurrencyException(
            `Appointment ${appointmentId} was modified by another transaction`,
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

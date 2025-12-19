import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IAppointmentFactory } from '@booking/domain/interfaces/factories/appointment-factory';
import { AppointmentModel } from '@booking/infra/persistence/models/appointment';
import { Appointment } from '@booking/domain/aggregates/appointment';
import { UUID } from '@shared/vo/uuid';
import { DateTime } from '@booking/domain/vo/date-time';
import { AppointmentStatus } from '@booking/domain/vo/appointment-status';

/**
 * Infrastructure implementation of IAppointmentFactory
 *
 * This factory loads domain aggregates from the database for modification.
 * It reconstructs the aggregate with all its business logic.
 *
 * Located in infrastructure because it depends on TypeORM and database models.
 *
 * @see .kiro/steering/factory-pattern.md for complete documentation
 */
@Injectable()
export class AppointmentFactory implements IAppointmentFactory {
  constructor(
    @InjectRepository(AppointmentModel)
    private readonly repository: Repository<AppointmentModel>,
  ) {}

  async loadById(id: string): Promise<Appointment | null> {
    const model = await this.repository.findOne({
      where: { id },
    });

    if (!model) {
      return null;
    }

    return Appointment.fromPersistence(
      UUID.fromString(model.id),
      UUID.fromString(model.businessId),
      UUID.fromString(model.customerId),
      UUID.fromString(model.offeringId),
      DateTime.fromDate(model.dateTime),
      AppointmentStatus.fromString(model.status),
      model.version,
    );
  }
}

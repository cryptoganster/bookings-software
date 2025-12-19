import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IAppointmentReadRepository } from '@booking/domain/interfaces/repositories/appointment-read';
import { AppointmentReadModel } from '@booking/domain/read-models/appointment';
import { AppointmentModel } from '@booking/infra/persistence/models/appointment';
import { AppointmentReadMapper } from '@booking/infra/persistence/mappers/appointment-read';

@Injectable()
export class AppointmentReadRepository implements IAppointmentReadRepository {
  constructor(
    @InjectRepository(AppointmentModel)
    private readonly repository: Repository<AppointmentModel>,
  ) {}

  async findById(id: string): Promise<AppointmentReadModel | null> {
    const result = await this.repository
      .createQueryBuilder('appointment')
      .leftJoin('customers', 'customer', 'customer.id = appointment.customerId')
      .leftJoin('offerings', 'offering', 'offering.id = appointment.offeringId')
      .select([
        'appointment.id as id',
        'appointment.businessId as "businessId"',
        'appointment.customerId as "customerId"',
        'customer.name as "customerName"',
        'customer.whatsapp_phone as "customerPhone"',
        'appointment.offeringId as "offeringId"',
        'offering.name as "offeringName"',
        'appointment.dateTime as "dateTime"',
        'appointment.status as status',
        'appointment.createdAt as "createdAt"',
        'appointment.cancelledAt as "cancelledAt"',
      ])
      .where('appointment.id = :id', { id })
      .getRawOne();

    if (!result) return null;

    return AppointmentReadMapper.toReadModel(result);
  }

  async findByCustomerId(customerId: string): Promise<AppointmentReadModel[]> {
    const results = await this.repository
      .createQueryBuilder('appointment')
      .leftJoin('customers', 'customer', 'customer.id = appointment.customerId')
      .leftJoin('offerings', 'offering', 'offering.id = appointment.offeringId')
      .select([
        'appointment.id as id',
        'appointment.businessId as "businessId"',
        'appointment.customerId as "customerId"',
        'customer.name as "customerName"',
        'customer.whatsapp_phone as "customerPhone"',
        'appointment.offeringId as "offeringId"',
        'offering.name as "offeringName"',
        'appointment.dateTime as "dateTime"',
        'appointment.status as status',
        'appointment.createdAt as "createdAt"',
        'appointment.cancelledAt as "cancelledAt"',
      ])
      .where('appointment.customerId = :customerId', { customerId })
      .orderBy('appointment.dateTime', 'ASC')
      .getRawMany();

    return results.map((result) => AppointmentReadMapper.toReadModel(result));
  }

  async findByBusinessId(
    businessId: string,
    filters?: {
      status?: 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
      startDate?: Date;
      endDate?: Date;
      offeringId?: string;
      customerId?: string;
    },
  ): Promise<AppointmentReadModel[]> {
    const queryBuilder = this.repository
      .createQueryBuilder('appointment')
      .leftJoin('customers', 'customer', 'customer.id = appointment.customerId')
      .leftJoin('offerings', 'offering', 'offering.id = appointment.offeringId')
      .select([
        'appointment.id as id',
        'appointment.businessId as "businessId"',
        'appointment.customerId as "customerId"',
        'customer.name as "customerName"',
        'customer.whatsapp_phone as "customerPhone"',
        'appointment.offeringId as "offeringId"',
        'offering.name as "offeringName"',
        'appointment.dateTime as "dateTime"',
        'appointment.status as status',
        'appointment.createdAt as "createdAt"',
        'appointment.cancelledAt as "cancelledAt"',
      ])
      .where('appointment.businessId = :businessId', { businessId });

    // Aplicar filtros opcionales
    if (filters?.status) {
      queryBuilder.andWhere('appointment.status = :status', { status: filters.status });
    }

    if (filters?.startDate) {
      queryBuilder.andWhere('appointment.dateTime >= :startDate', { startDate: filters.startDate });
    }

    if (filters?.endDate) {
      queryBuilder.andWhere('appointment.dateTime <= :endDate', { endDate: filters.endDate });
    }

    if (filters?.offeringId) {
      queryBuilder.andWhere('appointment.offeringId = :offeringId', {
        offeringId: filters.offeringId,
      });
    }

    if (filters?.customerId) {
      queryBuilder.andWhere('appointment.customerId = :customerId', {
        customerId: filters.customerId,
      });
    }

    queryBuilder.orderBy('appointment.dateTime', 'ASC');

    const results = await queryBuilder.getRawMany();

    return results.map((result) => AppointmentReadMapper.toReadModel(result));
  }

  async findUpcoming(businessId: string): Promise<AppointmentReadModel[]> {
    const now = new Date();
    const results = await this.repository
      .createQueryBuilder('appointment')
      .leftJoin('customers', 'customer', 'customer.id = appointment.customerId')
      .leftJoin('offerings', 'offering', 'offering.id = appointment.offeringId')
      .select([
        'appointment.id as id',
        'appointment.businessId as "businessId"',
        'appointment.customerId as "customerId"',
        'customer.name as "customerName"',
        'customer.whatsapp_phone as "customerPhone"',
        'appointment.offeringId as "offeringId"',
        'offering.name as "offeringName"',
        'appointment.dateTime as "dateTime"',
        'appointment.status as status',
        'appointment.createdAt as "createdAt"',
        'appointment.cancelledAt as "cancelledAt"',
      ])
      .where('appointment.businessId = :businessId', { businessId })
      .andWhere('appointment.dateTime >= :now', { now })
      .andWhere('appointment.status != :cancelled', { cancelled: 'CANCELLED' })
      .orderBy('appointment.dateTime', 'ASC')
      .getRawMany();

    return results.map((result) => AppointmentReadMapper.toReadModel(result));
  }

  async findByBusinessAndDateRange(
    businessId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<AppointmentReadModel[]> {
    const results = await this.repository
      .createQueryBuilder('appointment')
      .leftJoin('customers', 'customer', 'customer.id = appointment.customerId')
      .leftJoin('offerings', 'offering', 'offering.id = appointment.offeringId')
      .select([
        'appointment.id as id',
        'appointment.businessId as "businessId"',
        'appointment.customerId as "customerId"',
        'customer.name as "customerName"',
        'customer.whatsapp_phone as "customerPhone"',
        'appointment.offeringId as "offeringId"',
        'offering.name as "offeringName"',
        'appointment.dateTime as "dateTime"',
        'appointment.status as status',
        'appointment.createdAt as "createdAt"',
        'appointment.cancelledAt as "cancelledAt"',
      ])
      .where('appointment.businessId = :businessId', { businessId })
      .andWhere('appointment.dateTime >= :startDate', { startDate })
      .andWhere('appointment.dateTime <= :endDate', { endDate })
      .andWhere('appointment.status != :cancelled', { cancelled: 'CANCELLED' })
      .orderBy('appointment.dateTime', 'ASC')
      .getRawMany();

    return results.map((result) => AppointmentReadMapper.toReadModel(result));
  }
}

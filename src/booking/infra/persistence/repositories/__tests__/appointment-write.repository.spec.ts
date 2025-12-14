import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AppointmentWriteRepository } from '../appointment-write';
import { AppointmentModel } from '../../models/appointment';
import { Appointment } from '@booking/domain/aggregates/appointment';
import { UUID } from '@shared/vo/uuid';
import { DateTime } from '@booking/domain/vo/date-time';
import { ConcurrencyException } from '@shared/kernel/exceptions/concurrency';
import { TypeOrmUnitOfWork } from '@shared/infra/uow';

describe('AppointmentWriteRepository Integration Tests', () => {
  let module: TestingModule;
  let repository: AppointmentWriteRepository;
  let dataSource: DataSource;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT || '5432', 10),
          username: process.env.DB_USERNAME || 'postgres',
          password: process.env.DB_PASSWORD || 'postgres',
          database: process.env.DB_DATABASE || 'bookings_test',
          entities: [AppointmentModel],
          synchronize: true, // Solo para tests
          dropSchema: true, // Limpiar antes de cada ejecución
        }),
        TypeOrmModule.forFeature([AppointmentModel]),
      ],
      providers: [
        AppointmentWriteRepository,
        {
          provide: 'IUnitOfWork',
          useClass: TypeOrmUnitOfWork,
        },
      ],
    }).compile();

    repository = module.get<AppointmentWriteRepository>(AppointmentWriteRepository);
    dataSource = module.get<DataSource>(DataSource);
  });

  afterAll(async () => {
    await dataSource.destroy();
    await module.close();
  });

  afterEach(async () => {
    await dataSource.getRepository(AppointmentModel).clear();
  });

  describe('save', () => {
    it('should save appointment with correct version', async () => {
      // Arrange
      const appointment = Appointment.create(
        UUID.generate(),
        UUID.generate(),
        UUID.generate(),
        UUID.generate(),
        DateTime.fromDate(new Date(Date.now() + 86400000)), // Mañana
      );

      // Act
      await repository.save(appointment);

      // Assert
      const saved = await dataSource.getRepository(AppointmentModel).findOne({
        where: { id: appointment.getId().getValue() },
      });

      expect(saved).toBeDefined();
      expect(saved!.version).toBe(1);
      expect(saved!.status).toBe('CONFIRMED');
    });

    it('should throw ConcurrencyException when version is incorrect', async () => {
      // Arrange
      const appointment = Appointment.create(
        UUID.generate(),
        UUID.generate(),
        UUID.generate(),
        UUID.generate(),
        DateTime.fromDate(new Date(Date.now() + 86400000)),
      );

      await repository.save(appointment);

      // Simular que otro proceso modificó el appointment
      await dataSource
        .getRepository(AppointmentModel)
        .update({ id: appointment.getId().getValue() }, { version: 2 });

      // Act & Assert
      await expect(repository.save(appointment)).rejects.toThrow(ConcurrencyException);
    });
  });

  describe('findById', () => {
    it('should return appointment correctly hydrated', async () => {
      // Arrange
      const id = UUID.generate();
      const businessId = UUID.generate();
      const customerId = UUID.generate();
      const offeringId = UUID.generate();
      const dateTime = new Date(Date.now() + 86400000);

      await dataSource.getRepository(AppointmentModel).insert({
        id: id.getValue(),
        businessId: businessId.getValue(),
        customerId: customerId.getValue(),
        offeringId: offeringId.getValue(),
        dateTime,
        status: 'CONFIRMED',
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        cancelledAt: null,
      });

      // Act
      const appointment = await repository.findById(id);

      // Assert
      expect(appointment).toBeDefined();
      expect(appointment!.getId().getValue()).toBe(id.getValue());
      expect(appointment!.getBusinessId().getValue()).toBe(businessId.getValue());
      expect(appointment!.getVersion().getValue()).toBe(1);
      expect(appointment!.getStatus().getValue()).toBe('CONFIRMED');
    });

    it('should return null when appointment does not exist', async () => {
      // Act
      const appointment = await repository.findById(UUID.generate());

      // Assert
      expect(appointment).toBeNull();
    });
  });
});

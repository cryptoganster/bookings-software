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
import { AppointmentFactory } from '../../factories/appointment-factory';
import { E2EDatabaseHelper } from '@test-utils/helpers';
import { ensureMigrationsRun } from '../../../../../../test/test-setup';

describe('AppointmentWriteRepository Integration Tests', () => {
  let module: TestingModule;
  let repository: AppointmentWriteRepository;
  let factory: AppointmentFactory;
  let dataSource: DataSource;

  beforeAll(async () => {
    await ensureMigrationsRun();

    module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT || '5432', 10),
          username: process.env.DB_USERNAME || 'postgres',
          password: process.env.DB_PASSWORD || 'postgres',
          database: process.env.DB_DATABASE || 'postgres_test',
          entities: [AppointmentModel],
          synchronize: false, // Solo para tests
          dropSchema: false, // No eliminar el schema en cada test
        }),
        TypeOrmModule.forFeature([AppointmentModel]),
      ],
      providers: [
        AppointmentWriteRepository,
        AppointmentFactory,
        {
          provide: 'IUnitOfWork',
          useClass: TypeOrmUnitOfWork,
        },
      ],
    }).compile();

    repository = module.get<AppointmentWriteRepository>(AppointmentWriteRepository);
    factory = module.get<AppointmentFactory>(AppointmentFactory);
    dataSource = module.get<DataSource>(DataSource);
  }, 30000); // Aumentar timeout a 30 segundos

  afterAll(async () => {
    await dataSource.destroy();
    await module.close();
  });

  beforeEach(async () => {
    // Usar helper optimizado para limpiar tablas (más rápido que clear())
    await E2EDatabaseHelper.cleanDatabase(dataSource);
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

      // Save initial appointment (version will be 1)
      await repository.save(appointment);

      // Simular dos procesos concurrentes:
      // Proceso 1: Reload y modifica
      const process1Appointment = await factory.loadById(appointment.getId().getValue());
      expect(process1Appointment).toBeDefined();
      expect(process1Appointment!.getVersion().getValue()).toBe(1);
      process1Appointment!.cancel(); // version 2

      // Proceso 2: Reload y modifica
      const process2Appointment = await factory.loadById(appointment.getId().getValue());
      expect(process2Appointment).toBeDefined();
      expect(process2Appointment!.getVersion().getValue()).toBe(1);
      process2Appointment!.cancel(); // version 2

      // Proceso 1 guarda primero (éxito - BD pasa de version 1 a 2)
      await repository.save(process1Appointment!);

      // Proceso 2 intenta guardar (fallo - BD tiene version 2, pero proceso2 espera version 1)
      // Act & Assert
      await expect(repository.save(process2Appointment!)).rejects.toThrow(ConcurrencyException);
    });
  });

  // Note: findById() tests removed - this method is now in AppointmentFactory
  // Write repository only handles save() operations for CQRS strict compliance
});

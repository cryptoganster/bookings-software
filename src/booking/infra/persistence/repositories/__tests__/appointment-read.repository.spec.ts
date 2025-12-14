import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AppointmentReadRepository } from '../appointment-read.repository';
import { AppointmentModel } from '../../models/appointment';
import { UUID } from '@shared/vo/uuid';

describe('AppointmentReadRepository Integration Tests', () => {
  let module: TestingModule;
  let repository: AppointmentReadRepository;
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
          synchronize: true,
          dropSchema: true,
        }),
        TypeOrmModule.forFeature([AppointmentModel]),
      ],
      providers: [AppointmentReadRepository],
    }).compile();

    repository = module.get<AppointmentReadRepository>(AppointmentReadRepository);
    dataSource = module.get<DataSource>(DataSource);
  });

  afterAll(async () => {
    await dataSource.destroy();
    await module.close();
  });

  afterEach(async () => {
    await dataSource.getRepository(AppointmentModel).clear();
  });

  describe('findById', () => {
    it('should return read model with denormalized data', async () => {
      // Arrange
      const id = UUID.generate().getValue();
      const businessId = UUID.generate().getValue();
      const customerId = UUID.generate().getValue();
      const offeringId = UUID.generate().getValue();

      await dataSource.getRepository(AppointmentModel).insert({
        id,
        businessId,
        customerId,
        offeringId,
        dateTime: new Date(),
        status: 'CONFIRMED',
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        cancelledAt: null,
      });

      // Act
      const readModel = await repository.findById(id);

      // Assert
      expect(readModel).toBeDefined();
      expect(readModel!.id).toBe(id);
      expect(readModel!.businessId).toBe(businessId);
      expect(readModel!.status).toBe('CONFIRMED');
    });
  });

  describe('findByCustomerId', () => {
    it('should return all appointments for customer', async () => {
      // Arrange
      const customerId = UUID.generate().getValue();
      const businessId = UUID.generate().getValue();

      await dataSource.getRepository(AppointmentModel).insert([
        {
          id: UUID.generate().getValue(),
          businessId,
          customerId,
          offeringId: UUID.generate().getValue(),
          dateTime: new Date(Date.now() + 86400000),
          status: 'CONFIRMED',
          version: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          cancelledAt: null,
        },
        {
          id: UUID.generate().getValue(),
          businessId,
          customerId,
          offeringId: UUID.generate().getValue(),
          dateTime: new Date(Date.now() + 172800000),
          status: 'CONFIRMED',
          version: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          cancelledAt: null,
        },
      ]);

      // Act
      const appointments = await repository.findByCustomerId(customerId);

      // Assert
      expect(appointments).toHaveLength(2);
      expect(appointments[0].customerId).toBe(customerId);
      expect(appointments[1].customerId).toBe(customerId);
    });
  });

  describe('findUpcoming', () => {
    it('should return only future non-cancelled appointments', async () => {
      // Arrange
      const businessId = UUID.generate().getValue();
      const now = new Date();

      await dataSource.getRepository(AppointmentModel).insert([
        {
          id: UUID.generate().getValue(),
          businessId,
          customerId: UUID.generate().getValue(),
          offeringId: UUID.generate().getValue(),
          dateTime: new Date(now.getTime() + 86400000), // Futuro
          status: 'CONFIRMED',
          version: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          cancelledAt: null,
        },
        {
          id: UUID.generate().getValue(),
          businessId,
          customerId: UUID.generate().getValue(),
          offeringId: UUID.generate().getValue(),
          dateTime: new Date(now.getTime() - 86400000), // Pasado
          status: 'CONFIRMED',
          version: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          cancelledAt: null,
        },
        {
          id: UUID.generate().getValue(),
          businessId,
          customerId: UUID.generate().getValue(),
          offeringId: UUID.generate().getValue(),
          dateTime: new Date(now.getTime() + 172800000), // Futuro
          status: 'CANCELLED',
          version: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          cancelledAt: new Date(),
        },
      ]);

      // Act
      const appointments = await repository.findUpcoming(businessId);

      // Assert
      expect(appointments).toHaveLength(1);
      expect(appointments[0].status).toBe('CONFIRMED');
      expect(new Date(appointments[0].dateTime).getTime()).toBeGreaterThan(now.getTime());
    });
  });
});

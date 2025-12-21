import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AppointmentReadRepository } from '../appointment-read';
import { AppointmentModel } from '../../models/appointment';
import { CustomerModel } from '@customer/infra/persistence/models/customer.model';
import { UUID } from '@shared/vo/uuid';
import { getTestTypeOrmConfig } from '../../../../../../test/test-database.config';

describe('AppointmentReadRepository Integration Tests', () => {
  let module: TestingModule;
  let repository: AppointmentReadRepository;
  let dataSource: DataSource;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot(getTestTypeOrmConfig()),
        TypeOrmModule.forFeature([AppointmentModel]),
      ],
      providers: [AppointmentReadRepository],
    }).compile();

    repository = module.get<AppointmentReadRepository>(AppointmentReadRepository);
    dataSource = module.get<DataSource>(DataSource);
  }, 30000); // Aumentar timeout a 30 segundos

  afterAll(async () => {
    await dataSource.destroy();
    await module.close();
  });

  afterEach(async () => {
    // Clear in correct order due to foreign keys
    await dataSource.getRepository(AppointmentModel).clear();
    await dataSource.getRepository(CustomerModel).clear();
  });

  describe('findById', () => {
    it('should return read model with denormalized data', async () => {
      // Arrange
      const id = UUID.generate().getValue();
      const businessId = UUID.generate().getValue();
      const customerId = UUID.generate().getValue();
      const offeringId = UUID.generate().getValue();

      // Create customer first
      await dataSource.getRepository(CustomerModel).insert({
        id: customerId,
        user_id: null,
        business_id: businessId,
        whatsapp_phone: '+18095551234',
        name: 'Test Customer',
        version: 1,
        created_at: new Date(),
        updated_at: new Date(),
      });

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
      expect(readModel!.customerName).toBe('Test Customer');
      expect(readModel!.customerPhone).toBe('+18095551234');
    });
  });

  describe('findByCustomerId', () => {
    it('should return all appointments for customer', async () => {
      // Arrange
      const customerId = UUID.generate().getValue();
      const businessId = UUID.generate().getValue();

      // Create customer first
      await dataSource.getRepository(CustomerModel).insert({
        id: customerId,
        user_id: null,
        business_id: businessId,
        whatsapp_phone: '+18095555678',
        name: 'Test Customer 2',
        version: 1,
        created_at: new Date(),
        updated_at: new Date(),
      });

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
      expect(appointments[0].customerName).toBe('Test Customer 2');
      expect(appointments[0].customerPhone).toBe('+18095555678');
    });
  });

  describe('findUpcoming', () => {
    it('should return only future non-cancelled appointments', async () => {
      // Arrange
      const businessId = UUID.generate().getValue();
      const now = new Date();
      const customer1Id = UUID.generate().getValue();
      const customer2Id = UUID.generate().getValue();
      const customer3Id = UUID.generate().getValue();

      // Create customers first
      await dataSource.getRepository(CustomerModel).insert([
        {
          id: customer1Id,
          user_id: null,
          business_id: businessId,
          whatsapp_phone: '+18095559001',
          name: 'Customer 1',
          version: 1,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: customer2Id,
          user_id: null,
          business_id: businessId,
          whatsapp_phone: '+18095559002',
          name: 'Customer 2',
          version: 1,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: customer3Id,
          user_id: null,
          business_id: businessId,
          whatsapp_phone: '+18095559003',
          name: 'Customer 3',
          version: 1,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);

      await dataSource.getRepository(AppointmentModel).insert([
        {
          id: UUID.generate().getValue(),
          businessId,
          customerId: customer1Id,
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
          customerId: customer2Id,
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
          customerId: customer3Id,
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

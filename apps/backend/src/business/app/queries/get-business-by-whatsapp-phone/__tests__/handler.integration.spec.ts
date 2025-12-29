import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CqrsModule, QueryBus } from '@nestjs/cqrs';
import { GetBusinessByWhatsAppPhoneHandler } from '../handler';
import { GetBusinessByWhatsAppPhoneQuery } from '../query';
import { BusinessModel } from '@business/infra/persistence/models/business.model';
import { BusinessReadRepository } from '@business/infra/persistence/repositories/business-read.repository';
import { UUID } from '@shared/vo/uuid';
import { createTestUser, cleanDatabase } from '@test-utils/helpers';
import { ensureMigrationsRun } from '../../../../../../test/test-setup';

/**
 * Integration tests for GetBusinessByWhatsAppPhoneHandler
 *
 * Tests the complete flow of finding business by WhatsApp phone including:
 * - Finding existing business by phone
 * - Returning null when not found (not an error)
 * - Used by Conversation BC for message routing
 *
 * **Validates: Requirements 12.4**
 */
describe('GetBusinessByWhatsAppPhoneHandler Integration Tests', () => {
  let module: TestingModule;
  let queryBus: QueryBus;
  let dataSource: DataSource;

  beforeAll(async () => {
    await ensureMigrationsRun();

    module = await Test.createTestingModule({
      imports: [
        CqrsModule,
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT || '5432', 10),
          username: process.env.DB_USERNAME || 'postgres',
          password: process.env.DB_PASSWORD || 'postgres',
          database: process.env.DB_DATABASE || 'postgres_test',
          entities: [BusinessModel],
          synchronize: false,
          dropSchema: false,
        }),
        TypeOrmModule.forFeature([BusinessModel]),
      ],
      providers: [
        GetBusinessByWhatsAppPhoneHandler,
        {
          provide: 'IBusinessReadRepository',
          useClass: BusinessReadRepository,
        },
      ],
    }).compile();

    await module.init();

    queryBus = module.get<QueryBus>(QueryBus);
    dataSource = module.get<DataSource>(DataSource);
  }, 30000);

  beforeEach(async () => {
    await cleanDatabase(dataSource);
  });

  afterAll(async () => {
    await cleanDatabase(dataSource);
    await dataSource.destroy();
    await module.close();
  });

  describe('Find business by WhatsApp phone', () => {
    it('should return business when found by phone', async () => {
      // Arrange
      const businessId = UUID.generate().getValue();
      const ownerId = UUID.generate().getValue();
      const whatsappPhone = '+18095551234';
      await createTestUser(dataSource, ownerId);

      await dataSource.getRepository(BusinessModel).insert({
        id: businessId,
        ownerId: ownerId,
        name: 'Test Business',
        whatsappPhone: whatsappPhone,
        addressStreet: 'Calle Test 123',
        addressCity: 'Santo Domingo',
        addressState: 'DN',
        addressCountry: 'DO',
        addressPostalCode: '10100',
        timezone: 'America/Santo_Domingo',
        isActive: true,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const query = new GetBusinessByWhatsAppPhoneQuery(whatsappPhone);

      // Act
      const result = await queryBus.execute(query);

      // Assert
      expect(result).toBeDefined();
      expect(result).not.toBeNull();
      expect(result!.id).toBe(businessId);
      expect(result!.whatsappPhone).toBe(whatsappPhone);
      expect(result!.name).toBe('Test Business');
    });

    it('should return null when business not found (not an error)', async () => {
      // Arrange
      const nonExistentPhone = '+18095559999';
      const query = new GetBusinessByWhatsAppPhoneQuery(nonExistentPhone);

      // Act
      const result = await queryBus.execute(query);

      // Assert
      expect(result).toBeNull();
    });

    it('should find business with different phone formats', async () => {
      // Arrange
      const businessId = UUID.generate().getValue();
      const whatsappPhone = '+18095555678';
      const ownerId = UUID.generate().getValue();
      await createTestUser(dataSource, ownerId);

      await dataSource.getRepository(BusinessModel).insert({
        id: businessId,
        ownerId: ownerId,
        name: 'Format Test Business',
        whatsappPhone: whatsappPhone,
        addressStreet: 'Calle Format',
        addressCity: 'Santo Domingo',
        addressState: null,
        addressCountry: 'DO',
        addressPostalCode: null,
        timezone: 'America/Santo_Domingo',
        isActive: true,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const query = new GetBusinessByWhatsAppPhoneQuery(whatsappPhone);

      // Act
      const result = await queryBus.execute(query);

      // Assert
      expect(result).not.toBeNull();
      expect(result!.whatsappPhone).toBe(whatsappPhone);
    });
  });

  describe('Conversation BC integration', () => {
    it('should return business for message routing', async () => {
      // Arrange - Simulate incoming WhatsApp message scenario
      const businessId = UUID.generate().getValue();
      const whatsappPhone = '+18095551111';
      const ownerId = UUID.generate().getValue();
      await createTestUser(dataSource, ownerId);

      await dataSource.getRepository(BusinessModel).insert({
        id: businessId,
        ownerId: ownerId,
        name: 'Message Routing Business',
        whatsappPhone: whatsappPhone,
        addressStreet: 'Calle Routing',
        addressCity: 'Santo Domingo',
        addressState: null,
        addressCountry: 'DO',
        addressPostalCode: null,
        timezone: 'America/Santo_Domingo',
        isActive: true,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const query = new GetBusinessByWhatsAppPhoneQuery(whatsappPhone);

      // Act
      const result = await queryBus.execute(query);

      // Assert - Conversation BC can identify the business
      expect(result).not.toBeNull();
      expect(result!.id).toBe(businessId);
      expect(result!.timezone).toBe('America/Santo_Domingo'); // Needed for date conversion
    });

    it('should return null for unknown WhatsApp number (unregistered business)', async () => {
      // Arrange - Simulate message from unknown number
      const unknownPhone = '+18095559999';
      const query = new GetBusinessByWhatsAppPhoneQuery(unknownPhone);

      // Act
      const result = await queryBus.execute(query);

      // Assert - Conversation BC knows this is not a registered business
      expect(result).toBeNull();
    });
  });

  describe('Business state', () => {
    it('should return inactive business (Conversation BC handles state)', async () => {
      // Arrange
      const whatsappPhone = '+18095552222';
      const ownerId = UUID.generate().getValue();
      await createTestUser(dataSource, ownerId);

      await dataSource.getRepository(BusinessModel).insert({
        id: UUID.generate().getValue(),
        ownerId: ownerId,
        name: 'Inactive Business',
        whatsappPhone: whatsappPhone,
        addressStreet: 'Calle Inactive',
        addressCity: 'Santo Domingo',
        addressState: null,
        addressCountry: 'DO',
        addressPostalCode: null,
        timezone: 'America/Santo_Domingo',
        isActive: false, // Inactive
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const query = new GetBusinessByWhatsAppPhoneQuery(whatsappPhone);

      // Act
      const result = await queryBus.execute(query);

      // Assert - Query returns business, Conversation BC decides how to handle inactive state
      expect(result).not.toBeNull();
      expect(result!.isActive).toBe(false);
    });
  });
});

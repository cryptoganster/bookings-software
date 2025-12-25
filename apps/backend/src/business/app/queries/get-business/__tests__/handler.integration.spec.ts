import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CqrsModule, QueryBus } from '@nestjs/cqrs';
import { GetBusinessHandler } from '../handler';
import { GetBusinessQuery } from '../query';
import { BusinessModel } from '@business/infra/persistence/models/business.model';
import { BusinessReadRepository } from '@business/infra/persistence/repositories/business-read.repository';
import { BusinessNotFoundException } from '@business/domain/exceptions/business-not-found';
import { UUID } from '@shared/vo/uuid';

/**
 * Integration tests for GetBusinessHandler
 *
 * Tests the complete flow of retrieving a business including:
 * - Finding existing business
 * - Handling not found case
 * - Returning complete read model
 *
 * **Validates: Requirements 10.4**
 */
describe('GetBusinessHandler Integration Tests', () => {
  let module: TestingModule;
  let queryBus: QueryBus;
  let dataSource: DataSource;

  beforeAll(async () => {
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
        GetBusinessHandler,
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

  afterAll(async () => {
    await dataSource.destroy();
    await module.close();
  });

  afterEach(async () => {
    await dataSource.getRepository(BusinessModel).clear();
  });

  describe('Find existing business', () => {
    it('should return business when found', async () => {
      // Arrange
      const businessId = UUID.generate().getValue();
      const ownerId = UUID.generate().getValue();

      await dataSource.getRepository(BusinessModel).insert({
        id: businessId,
        ownerId: ownerId,
        name: 'Test Business',
        whatsappPhone: '+18095551234',
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

      const query = new GetBusinessQuery(businessId);

      // Act
      const result = await queryBus.execute(query);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe(businessId);
      expect(result.ownerId).toBe(ownerId);
      expect(result.name).toBe('Test Business');
      expect(result.whatsappPhone).toBe('+18095551234');
      expect(result.addressStreet).toBe('Calle Test 123');
      expect(result.addressCity).toBe('Santo Domingo');
      expect(result.addressState).toBe('DN');
      expect(result.addressCountry).toBe('DO');
      expect(result.addressPostalCode).toBe('10100');
      expect(result.timezone).toBe('America/Santo_Domingo');
      expect(result.isActive).toBe(true);
    });

    it('should return business with minimal address', async () => {
      // Arrange
      const businessId = UUID.generate().getValue();

      await dataSource.getRepository(BusinessModel).insert({
        id: businessId,
        ownerId: UUID.generate().getValue(),
        name: 'Minimal Business',
        whatsappPhone: '+18095555678',
        addressStreet: 'Calle Minimal',
        addressCity: 'Santiago',
        addressState: null,
        addressCountry: 'DO',
        addressPostalCode: null,
        timezone: 'America/Santo_Domingo',
        isActive: true,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const query = new GetBusinessQuery(businessId);

      // Act
      const result = await queryBus.execute(query);

      // Assert
      expect(result.addressStreet).toBe('Calle Minimal');
      expect(result.addressCity).toBe('Santiago');
      expect(result.addressState).toBeNull();
      expect(result.addressPostalCode).toBeNull();
    });
  });

  describe('Business not found', () => {
    it('should throw BusinessNotFoundException when business does not exist', async () => {
      // Arrange
      const nonExistentId = UUID.generate().getValue();
      const query = new GetBusinessQuery(nonExistentId);

      // Act & Assert
      await expect(queryBus.execute(query)).rejects.toThrow(BusinessNotFoundException);
    });
  });

  describe('Business state', () => {
    it('should return inactive business', async () => {
      // Arrange
      const businessId = UUID.generate().getValue();

      await dataSource.getRepository(BusinessModel).insert({
        id: businessId,
        ownerId: UUID.generate().getValue(),
        name: 'Inactive Business',
        whatsappPhone: '+18095559999',
        addressStreet: 'Calle Inactive',
        addressCity: 'Santo Domingo',
        addressState: null,
        addressCountry: 'DO',
        addressPostalCode: null,
        timezone: 'America/Santo_Domingo',
        isActive: false,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const query = new GetBusinessQuery(businessId);

      // Act
      const result = await queryBus.execute(query);

      // Assert
      expect(result.isActive).toBe(false);
    });
  });
});

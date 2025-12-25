import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CqrsModule, QueryBus } from '@nestjs/cqrs';
import { GetBusinessesByOwnerIdHandler } from '../handler';
import { GetBusinessesByOwnerIdQuery } from '../query';
import { BusinessModel } from '@business/infra/persistence/models/business.model';
import { BusinessReadRepository } from '@business/infra/persistence/repositories/business-read.repository';
import { UUID } from '@shared/vo/uuid';

/**
 * Integration tests for GetBusinessesByOwnerIdHandler
 *
 * Tests the complete flow of retrieving businesses by owner including:
 * - Finding multiple businesses for same owner
 * - Returning empty list when no businesses found
 * - Multi-business support validation
 *
 * **Validates: Requirements 10.5**
 */
describe('GetBusinessesByOwnerIdHandler Integration Tests', () => {
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
        GetBusinessesByOwnerIdHandler,
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

  describe('Find businesses by owner', () => {
    it('should return multiple businesses for same owner', async () => {
      // Arrange
      const ownerId = UUID.generate().getValue();

      const businesses = [
        {
          id: UUID.generate().getValue(),
          ownerId: ownerId,
          name: 'Business 1',
          whatsappPhone: '+18095551111',
          addressStreet: 'Calle 1',
          addressCity: 'Santo Domingo',
          addressState: null,
          addressCountry: 'DO',
          addressPostalCode: null,
          timezone: 'America/Santo_Domingo',
          isActive: true,
          version: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: UUID.generate().getValue(),
          ownerId: ownerId,
          name: 'Business 2',
          whatsappPhone: '+18095552222',
          addressStreet: 'Calle 2',
          addressCity: 'Santiago',
          addressState: null,
          addressCountry: 'DO',
          addressPostalCode: null,
          timezone: 'America/Santo_Domingo',
          isActive: true,
          version: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: UUID.generate().getValue(),
          ownerId: ownerId,
          name: 'Business 3',
          whatsappPhone: '+18095553333',
          addressStreet: 'Calle 3',
          addressCity: 'La Vega',
          addressState: null,
          addressCountry: 'DO',
          addressPostalCode: null,
          timezone: 'America/Santo_Domingo',
          isActive: true,
          version: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      await dataSource.getRepository(BusinessModel).insert(businesses);

      const query = new GetBusinessesByOwnerIdQuery(ownerId);

      // Act
      const result = await queryBus.execute(query);

      // Assert
      expect(result).toHaveLength(3);
      expect(result.every((b) => b.ownerId === ownerId)).toBe(true);
      expect(result.map((b) => b.name)).toContain('Business 1');
      expect(result.map((b) => b.name)).toContain('Business 2');
      expect(result.map((b) => b.name)).toContain('Business 3');
    });

    it('should return empty list when owner has no businesses', async () => {
      // Arrange
      const ownerWithNoBusinesses = UUID.generate().getValue();
      const query = new GetBusinessesByOwnerIdQuery(ownerWithNoBusinesses);

      // Act
      const result = await queryBus.execute(query);

      // Assert
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should not return businesses from other owners', async () => {
      // Arrange
      const owner1 = UUID.generate().getValue();
      const owner2 = UUID.generate().getValue();

      await dataSource.getRepository(BusinessModel).insert([
        {
          id: UUID.generate().getValue(),
          ownerId: owner1,
          name: 'Owner 1 Business',
          whatsappPhone: '+18095551111',
          addressStreet: 'Calle 1',
          addressCity: 'Santo Domingo',
          addressState: null,
          addressCountry: 'DO',
          addressPostalCode: null,
          timezone: 'America/Santo_Domingo',
          isActive: true,
          version: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: UUID.generate().getValue(),
          ownerId: owner2,
          name: 'Owner 2 Business',
          whatsappPhone: '+18095552222',
          addressStreet: 'Calle 2',
          addressCity: 'Santiago',
          addressState: null,
          addressCountry: 'DO',
          addressPostalCode: null,
          timezone: 'America/Santo_Domingo',
          isActive: true,
          version: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const query = new GetBusinessesByOwnerIdQuery(owner1);

      // Act
      const result = await queryBus.execute(query);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].ownerId).toBe(owner1);
      expect(result[0].name).toBe('Owner 1 Business');
    });
  });

  describe('Business states', () => {
    it('should return both active and inactive businesses', async () => {
      // Arrange
      const ownerId = UUID.generate().getValue();

      await dataSource.getRepository(BusinessModel).insert([
        {
          id: UUID.generate().getValue(),
          ownerId: ownerId,
          name: 'Active Business',
          whatsappPhone: '+18095551111',
          addressStreet: 'Calle Active',
          addressCity: 'Santo Domingo',
          addressState: null,
          addressCountry: 'DO',
          addressPostalCode: null,
          timezone: 'America/Santo_Domingo',
          isActive: true,
          version: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: UUID.generate().getValue(),
          ownerId: ownerId,
          name: 'Inactive Business',
          whatsappPhone: '+18095552222',
          addressStreet: 'Calle Inactive',
          addressCity: 'Santiago',
          addressState: null,
          addressCountry: 'DO',
          addressPostalCode: null,
          timezone: 'America/Santo_Domingo',
          isActive: false,
          version: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const query = new GetBusinessesByOwnerIdQuery(ownerId);

      // Act
      const result = await queryBus.execute(query);

      // Assert
      expect(result).toHaveLength(2);
      expect(result.find((b) => b.name === 'Active Business')?.isActive).toBe(true);
      expect(result.find((b) => b.name === 'Inactive Business')?.isActive).toBe(false);
    });
  });
});

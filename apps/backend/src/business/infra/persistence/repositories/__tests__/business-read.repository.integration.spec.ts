/**
 * BusinessReadRepository Integration Tests
 *
 * Tests the read repository with real database queries,
 * focusing on query optimization and data retrieval.
 *
 * Requirements: 14.4, 9.3
 */

import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { BusinessReadRepository } from '../business-read.repository';
import { BusinessModel } from '../../models/business.model';
import { UUID } from '@shared/vo/uuid';
import { E2EDatabaseHelper } from '@test-utils/e2e-helpers';

describe('BusinessReadRepository Integration Tests', () => {
  let module: TestingModule;
  let repository: BusinessReadRepository;
  let dataSource: DataSource;
  let dbHelper: E2EDatabaseHelper;

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
          entities: [BusinessModel],
          synchronize: true, // ← Changed from false to true to auto-create tables
        }),
        TypeOrmModule.forFeature([BusinessModel]),
      ],
      providers: [BusinessReadRepository],
    }).compile();

    repository = module.get<BusinessReadRepository>(BusinessReadRepository);
    dataSource = module.get<DataSource>(DataSource);

    // Setup database tables (creates all tables if they don't exist)
    dbHelper = new E2EDatabaseHelper(dataSource);
    await dbHelper.setup();
  });

  afterAll(async () => {
    await dataSource.destroy();
    await module.close();
  });

  beforeEach(async () => {
    // Clean up businesses table before each test
    await dataSource.query('DELETE FROM businesses');
  });

  describe('findById()', () => {
    it('should return null when business not found', async () => {
      // Arrange
      const nonExistentId = UUID.generate().getValue();

      // Act
      const result = await repository.findById(nonExistentId);

      // Assert
      expect(result).toBeNull();
    });

    it('should return business read model with all fields', async () => {
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
        version: 0,
      });

      // Act
      const result = await repository.findById(businessId);

      // Assert
      expect(result).toBeDefined();
      expect(result!.id).toBe(businessId);
      expect(result!.ownerId).toBe(ownerId);
      expect(result!.name).toBe('Test Business');
      expect(result!.whatsappPhone).toBe('+18095551234');
      expect(result!.addressStreet).toBe('Calle Test 123');
      expect(result!.addressCity).toBe('Santo Domingo');
      expect(result!.addressState).toBe('DN');
      expect(result!.addressCountry).toBe('DO');
      expect(result!.addressPostalCode).toBe('10100');
      expect(result!.timezone).toBe('America/Santo_Domingo');
      expect(result!.isActive).toBe(true);
      expect(result!.version).toBe(0);
    });
  });

  describe('findByOwnerId()', () => {
    it('should return empty array when owner has no businesses', async () => {
      // Arrange
      const ownerId = UUID.generate().getValue();

      // Act
      const result = await repository.findByOwnerId(ownerId);

      // Assert
      expect(result).toEqual([]);
    });

    it('should return all businesses for owner', async () => {
      // Arrange
      const ownerId = UUID.generate().getValue();

      await dataSource.getRepository(BusinessModel).insert([
        {
          id: UUID.generate().getValue(),
          ownerId: ownerId,
          name: 'Business 1',
          whatsappPhone: '+18095551111',
          addressStreet: 'Calle 1',
          addressCity: 'Santo Domingo',
          addressState: 'DN',
          addressCountry: 'DO',
          addressPostalCode: '10100',
          timezone: 'America/Santo_Domingo',
          isActive: true,
          version: 0,
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
          isActive: false,
          version: 0,
        },
      ]);

      // Act
      const result = await repository.findByOwnerId(ownerId);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Business 1');
      expect(result[1].name).toBe('Business 2');
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
          addressState: 'DN',
          addressCountry: 'DO',
          addressPostalCode: '10100',
          timezone: 'America/Santo_Domingo',
          isActive: true,
          version: 0,
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
          version: 0,
        },
      ]);

      // Act
      const result = await repository.findByOwnerId(owner1);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Owner 1 Business');
    });
  });

  describe('findByWhatsAppPhone()', () => {
    it('should return null when phone not found', async () => {
      // Arrange
      const phone = '+18095559999';

      // Act
      const result = await repository.findByWhatsAppPhone(phone);

      // Assert
      expect(result).toBeNull();
    });

    it('should return business when found by phone', async () => {
      // Arrange
      const businessId = UUID.generate().getValue();
      const phone = '+18095551234';

      await dataSource.getRepository(BusinessModel).insert({
        id: businessId,
        ownerId: UUID.generate().getValue(),
        name: 'Test Business',
        whatsappPhone: phone,
        addressStreet: 'Calle Test',
        addressCity: 'Santo Domingo',
        addressState: 'DN',
        addressCountry: 'DO',
        addressPostalCode: '10100',
        timezone: 'America/Santo_Domingo',
        isActive: true,
        version: 0,
      });

      // Act
      const result = await repository.findByWhatsAppPhone(phone);

      // Assert
      expect(result).toBeDefined();
      expect(result!.id).toBe(businessId);
      expect(result!.whatsappPhone).toBe(phone);
    });

    it('should return inactive business (state handled by caller)', async () => {
      // Arrange
      const phone = '+18095558888';

      await dataSource.getRepository(BusinessModel).insert({
        id: UUID.generate().getValue(),
        ownerId: UUID.generate().getValue(),
        name: 'Inactive Business',
        whatsappPhone: phone,
        addressStreet: 'Calle Inactive',
        addressCity: 'Santo Domingo',
        addressState: 'DN',
        addressCountry: 'DO',
        addressPostalCode: '10100',
        timezone: 'America/Santo_Domingo',
        isActive: false, // ← Inactive
        version: 0,
      });

      // Act
      const result = await repository.findByWhatsAppPhone(phone);

      // Assert
      expect(result).toBeDefined();
      expect(result!.isActive).toBe(false);
    });
  });

  describe('Query performance', () => {
    it('should handle large result sets efficiently', async () => {
      // Arrange
      const ownerId = UUID.generate().getValue();
      const businesses = Array.from({ length: 50 }, (_, i) => ({
        id: UUID.generate().getValue(),
        ownerId: ownerId,
        name: `Business ${i}`,
        whatsappPhone: `+1809555${i.toString().padStart(4, '0')}`,
        addressStreet: `Calle ${i}`,
        addressCity: 'Santo Domingo',
        addressState: 'DN',
        addressCountry: 'DO',
        addressPostalCode: '10100',
        timezone: 'America/Santo_Domingo',
        isActive: true,
        version: 0,
      }));

      await dataSource.getRepository(BusinessModel).insert(businesses);

      // Act
      const startTime = Date.now();
      const result = await repository.findByOwnerId(ownerId);
      const duration = Date.now() - startTime;

      // Assert
      expect(result).toHaveLength(50);
      expect(duration).toBeLessThan(1000); // Should complete in < 1 second
    });
  });
});

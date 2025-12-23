/**
 * BusinessFactory Integration Tests
 *
 * Tests the factory's ability to load and reconstruct Business aggregates
 * from persistence, preserving version and business logic.
 *
 * Requirements: 14.4, 9.4, 9.5
 */

import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { BusinessFactory } from '../business.factory';
import { BusinessModel } from '../../models/business.model';
import { UUID } from '@shared/vo/uuid';
import { E2EDatabaseHelper } from '@test-utils/e2e-helpers';

describe('BusinessFactory Integration Tests', () => {
  let module: TestingModule;
  let factory: BusinessFactory;
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
      providers: [BusinessFactory],
    }).compile();

    factory = module.get<BusinessFactory>(BusinessFactory);
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

  describe('loadById()', () => {
    it('should return null when business not found', async () => {
      // Arrange
      const nonExistentId = UUID.generate().getValue();

      // Act
      const result = await factory.loadById(nonExistentId);

      // Assert
      expect(result).toBeNull();
    });

    it('should load business aggregate with all properties', async () => {
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
      const business = await factory.loadById(businessId);

      // Assert
      expect(business).toBeDefined();
      expect(business!.getId().getValue()).toBe(businessId);
      expect(business!.getOwnerId().getValue()).toBe(ownerId);
      expect(business!.getName()).toBe('Test Business');
      expect(business!.getWhatsAppPhone().getValue()).toBe('+18095551234');
      expect(business!.getTimezone().getValue()).toBe('America/Santo_Domingo');
      expect(business!.getIsActive()).toBe(true);
    });

    it('should preserve version when loading aggregate', async () => {
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
        version: 5, // ← Specific version
      });

      // Act
      const business = await factory.loadById(businessId);

      // Assert
      expect(business!.getVersion().getValue()).toBe(5);
    });

    it('should load business with minimal address (null optional fields)', async () => {
      // Arrange
      const businessId = UUID.generate().getValue();
      const ownerId = UUID.generate().getValue();

      await dataSource.getRepository(BusinessModel).insert({
        id: businessId,
        ownerId: ownerId,
        name: 'Minimal Business',
        whatsappPhone: '+18095559999',
        addressStreet: 'Calle Minimal',
        addressCity: 'Santiago',
        addressState: null, // ← Optional
        addressCountry: 'DO',
        addressPostalCode: null, // ← Optional
        timezone: 'America/Santo_Domingo',
        isActive: true,
        version: 0,
      });

      // Act
      const business = await factory.loadById(businessId);

      // Assert
      expect(business).toBeDefined();
      expect(business!.getName()).toBe('Minimal Business');
      // Address should be reconstructed correctly with nulls
    });

    it('should load inactive business', async () => {
      // Arrange
      const businessId = UUID.generate().getValue();
      const ownerId = UUID.generate().getValue();

      await dataSource.getRepository(BusinessModel).insert({
        id: businessId,
        ownerId: ownerId,
        name: 'Inactive Business',
        whatsappPhone: '+18095558888',
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
      const business = await factory.loadById(businessId);

      // Assert
      expect(business!.getIsActive()).toBe(false);
    });

    it('should load business with high version number', async () => {
      // Arrange
      const businessId = UUID.generate().getValue();
      const ownerId = UUID.generate().getValue();

      await dataSource.getRepository(BusinessModel).insert({
        id: businessId,
        ownerId: ownerId,
        name: 'High Version Business',
        whatsappPhone: '+18095557777',
        addressStreet: 'Calle Version',
        addressCity: 'Santo Domingo',
        addressState: 'DN',
        addressCountry: 'DO',
        addressPostalCode: '10100',
        timezone: 'America/Santo_Domingo',
        isActive: true,
        version: 100, // ← High version
      });

      // Act
      const business = await factory.loadById(businessId);

      // Assert
      expect(business!.getVersion().getValue()).toBe(100);
    });
  });

  describe('Aggregate business logic after loading', () => {
    it('should allow business logic operations on loaded aggregate', async () => {
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
      const business = await factory.loadById(businessId);

      // Assert - Business logic should work
      const newAddress = business!.getAddress();
      const newTimezone = business!.getTimezone();
      expect(() => business!.updateInfo('New Name', newAddress, newTimezone)).not.toThrow();
      expect(() => business!.deactivate()).not.toThrow();
      expect(business!.getIsActive()).toBe(false);
    });

    it('should increment version when business logic is applied', async () => {
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
        version: 3,
      });

      // Act
      const business = await factory.loadById(businessId);
      const initialVersion = business!.getVersion().getValue();

      const newAddress = business!.getAddress();
      const newTimezone = business!.getTimezone();
      business!.updateInfo('Updated Name', newAddress, newTimezone);

      // Assert
      expect(business!.getVersion().getValue()).toBe(initialVersion + 1);
    });
  });
});

/**
 * BusinessWriteRepository Integration Tests
 *
 * Tests the write repository with real database operations,
 * focusing on Optimistic Locking and concurrency handling.
 *
 * Requirements: 14.4, 9.4, 9.5
 */

import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { BusinessWriteRepository } from '../business-write.repository';
import { BusinessModel } from '../../models/business.model';
import { Business } from '@business/domain/aggregates/business';
import { UUID } from '@shared/vo/uuid';
import { WhatsAppPhone } from '@shared/vo/whatsapp-phone';
import { BusinessAddress } from '@business/domain/vo/business-address';
import { Timezone } from '@business/domain/vo/timezone';
import { ConcurrencyException } from '@shared/kernel/exceptions/concurrency';
import { TypeOrmUnitOfWork } from '@shared/infra/uow';

describe('BusinessWriteRepository Integration Tests', () => {
  let module: TestingModule;
  let repository: BusinessWriteRepository;
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
          entities: [BusinessModel],
          synchronize: false,
        }),
        TypeOrmModule.forFeature([BusinessModel]),
      ],
      providers: [
        BusinessWriteRepository,
        {
          provide: 'IUnitOfWork',
          useClass: TypeOrmUnitOfWork,
        },
      ],
    }).compile();

    repository = module.get<BusinessWriteRepository>(BusinessWriteRepository);
    dataSource = module.get<DataSource>(DataSource);
  });

  afterAll(async () => {
    await dataSource.destroy();
    await module.close();
  });

  beforeEach(async () => {
    // Clean up businesses table before each test
    await dataSource.query('DELETE FROM businesses');
  });

  describe('save() - Optimistic Locking', () => {
    it('should save new business successfully', async () => {
      // Arrange
      const business = Business.create(
        UUID.generate(),
        UUID.generate(),
        'Test Business',
        WhatsAppPhone.fromString('+18095551234'),
        BusinessAddress.create('Calle Test 123', 'Santo Domingo', 'DN', 'DO', '10100'),
        Timezone.create('America/Santo_Domingo'),
      );

      // Act
      await repository.save(business);

      // Assert
      const saved = await dataSource.getRepository(BusinessModel).findOne({
        where: { id: business.getId().getValue() },
      });

      expect(saved).toBeDefined();
      expect(saved!.name).toBe('Test Business');
      expect(saved!.version).toBe(1); // Version incremented after create
    });

    it('should update existing business and increment version', async () => {
      // Arrange
      const businessId = UUID.generate();
      const ownerId = UUID.generate();

      // Create initial business
      const business = Business.create(
        businessId,
        ownerId,
        'Initial Name',
        WhatsAppPhone.fromString('+18095551234'),
        BusinessAddress.create('Calle Test 123', 'Santo Domingo', 'DN', 'DO', '10100'),
        Timezone.create('America/Santo_Domingo'),
      );

      await repository.save(business);

      // Load from DB to get current version
      const loaded = await dataSource.getRepository(BusinessModel).findOne({
        where: { id: businessId.getValue() },
      });
      const currentVersion = loaded!.version;

      // Reconstruct aggregate
      const businessToUpdate = Business.fromPersistence(
        businessId,
        ownerId,
        'Initial Name',
        WhatsAppPhone.fromString('+18095551234'),
        BusinessAddress.create('Calle Test 123', 'Santo Domingo', 'DN', 'DO', '10100'),
        Timezone.create('America/Santo_Domingo'),
        true,
        loaded!.createdAt,
        currentVersion,
      );

      // Act - Update business
      businessToUpdate.updateInfo(
        'Updated Name',
        BusinessAddress.create('Calle Updated', 'Santiago', 'ST', 'DO', '51000'),
        Timezone.create('America/New_York'),
      );

      await repository.save(businessToUpdate);

      // Assert
      const updated = await dataSource.getRepository(BusinessModel).findOne({
        where: { id: businessId.getValue() },
      });

      expect(updated!.name).toBe('Updated Name');
      expect(updated!.addressCity).toBe('Santiago');
      expect(updated!.version).toBe(currentVersion + 1);
    });

    it('should throw ConcurrencyException when version mismatch', async () => {
      // Arrange
      const businessId = UUID.generate();
      const ownerId = UUID.generate();

      // Create initial business
      const business = Business.create(
        businessId,
        ownerId,
        'Test Business',
        WhatsAppPhone.fromString('+18095551234'),
        BusinessAddress.create('Calle Test 123', 'Santo Domingo', 'DN', 'DO', '10100'),
        Timezone.create('America/Santo_Domingo'),
      );

      await repository.save(business);

      // Load from DB
      const loaded = await dataSource.getRepository(BusinessModel).findOne({
        where: { id: businessId.getValue() },
      });

      // Simulate two concurrent updates
      const business1 = Business.fromPersistence(
        businessId,
        ownerId,
        'Test Business',
        WhatsAppPhone.fromString('+18095551234'),
        BusinessAddress.create('Calle Test 123', 'Santo Domingo', 'DN', 'DO', '10100'),
        Timezone.create('America/Santo_Domingo'),
        true,
        loaded!.createdAt,
        loaded!.version,
      );

      const business2 = Business.fromPersistence(
        businessId,
        ownerId,
        'Test Business',
        WhatsAppPhone.fromString('+18095551234'),
        BusinessAddress.create('Calle Test 123', 'Santo Domingo', 'DN', 'DO', '10100'),
        Timezone.create('America/Santo_Domingo'),
        true,
        loaded!.createdAt,
        loaded!.version,
      );

      // Act - First update succeeds
      business1.updateInfo('Update 1', business1.getAddress(), business1.getTimezone());
      await repository.save(business1);

      // Second update should fail (stale version)
      business2.updateInfo('Update 2', business2.getAddress(), business2.getTimezone());

      // Assert
      await expect(repository.save(business2)).rejects.toThrow(ConcurrencyException);
    });

    it('should handle multiple sequential updates correctly', async () => {
      // Arrange
      const businessId = UUID.generate();
      const ownerId = UUID.generate();

      const business = Business.create(
        businessId,
        ownerId,
        'Test Business',
        WhatsAppPhone.fromString('+18095551234'),
        BusinessAddress.create('Calle Test 123', 'Santo Domingo', 'DN', 'DO', '10100'),
        Timezone.create('America/Santo_Domingo'),
      );

      await repository.save(business);

      // Act - Perform 5 sequential updates
      for (let i = 1; i <= 5; i++) {
        const loaded = await dataSource.getRepository(BusinessModel).findOne({
          where: { id: businessId.getValue() },
        });

        const businessToUpdate = Business.fromPersistence(
          businessId,
          ownerId,
          loaded!.name,
          WhatsAppPhone.fromString(loaded!.whatsappPhone),
          BusinessAddress.create(
            loaded!.addressStreet,
            loaded!.addressCity,
            loaded!.addressState,
            loaded!.addressCountry,
            loaded!.addressPostalCode,
          ),
          Timezone.create(loaded!.timezone),
          loaded!.isActive,
          loaded!.createdAt,
          loaded!.version,
        );

        businessToUpdate.updateInfo(
          `Update ${i}`,
          businessToUpdate.getAddress(),
          businessToUpdate.getTimezone(),
        );

        await repository.save(businessToUpdate);
      }

      // Assert
      const final = await dataSource.getRepository(BusinessModel).findOne({
        where: { id: businessId.getValue() },
      });

      expect(final!.name).toBe('Update 5');
      expect(final!.version).toBe(6); // Initial version 1 + 5 updates
    });
  });

  describe('save() - Business state changes', () => {
    it('should save business deactivation', async () => {
      // Arrange
      const business = Business.create(
        UUID.generate(),
        UUID.generate(),
        'Test Business',
        WhatsAppPhone.fromString('+18095551234'),
        BusinessAddress.create('Calle Test 123', 'Santo Domingo', 'DN', 'DO', '10100'),
        Timezone.create('America/Santo_Domingo'),
      );

      await repository.save(business);

      // Load and deactivate
      const loaded = await dataSource.getRepository(BusinessModel).findOne({
        where: { id: business.getId().getValue() },
      });

      const businessToDeactivate = Business.fromPersistence(
        business.getId(),
        business.getOwnerId(),
        loaded!.name,
        WhatsAppPhone.fromString(loaded!.whatsappPhone),
        BusinessAddress.create(
          loaded!.addressStreet,
          loaded!.addressCity,
          loaded!.addressState,
          loaded!.addressCountry,
          loaded!.addressPostalCode,
        ),
        Timezone.create(loaded!.timezone),
        loaded!.isActive,
        loaded!.createdAt,
        loaded!.version,
      );

      // Act
      businessToDeactivate.deactivate();
      await repository.save(businessToDeactivate);

      // Assert
      const updated = await dataSource.getRepository(BusinessModel).findOne({
        where: { id: business.getId().getValue() },
      });

      expect(updated!.isActive).toBe(false);
    });

    it('should save WhatsApp configuration change', async () => {
      // Arrange
      const business = Business.create(
        UUID.generate(),
        UUID.generate(),
        'Test Business',
        WhatsAppPhone.fromString('+18095551234'),
        BusinessAddress.create('Calle Test 123', 'Santo Domingo', 'DN', 'DO', '10100'),
        Timezone.create('America/Santo_Domingo'),
      );

      await repository.save(business);

      // Load and configure WhatsApp
      const loaded = await dataSource.getRepository(BusinessModel).findOne({
        where: { id: business.getId().getValue() },
      });

      const businessToUpdate = Business.fromPersistence(
        business.getId(),
        business.getOwnerId(),
        loaded!.name,
        WhatsAppPhone.fromString(loaded!.whatsappPhone),
        BusinessAddress.create(
          loaded!.addressStreet,
          loaded!.addressCity,
          loaded!.addressState,
          loaded!.addressCountry,
          loaded!.addressPostalCode,
        ),
        Timezone.create(loaded!.timezone),
        loaded!.isActive,
        loaded!.createdAt,
        loaded!.version,
      );

      // Act
      businessToUpdate.configureWhatsApp(WhatsAppPhone.fromString('+18095559999'));
      await repository.save(businessToUpdate);

      // Assert
      const updated = await dataSource.getRepository(BusinessModel).findOne({
        where: { id: business.getId().getValue() },
      });

      expect(updated!.whatsappPhone).toBe('+18095559999');
    });
  });
});

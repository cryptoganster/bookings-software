import { Test, TestingModule } from '@nestjs/testing';
import { DataSource, Repository } from 'typeorm';
import { BlockoutFactory } from '../blockout-factory';
import { BlockoutModel } from '../../models/blockout';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  createIntegrationTestDataSource,
  cleanDatabase,
  generateTestId,
} from '@test-utils/integration-test-helper';

describe('BlockoutFactory (Integration)', () => {
  let module: TestingModule;
  let factory: BlockoutFactory;
  let repository: Repository<BlockoutModel>;
  let dataSource: DataSource;

  beforeAll(async () => {
    // Create shared DataSource with ALL entities
    dataSource = await createIntegrationTestDataSource();

    module = await Test.createTestingModule({
      providers: [
        BlockoutFactory,
        {
          provide: getRepositoryToken(BlockoutModel),
          useFactory: (dataSource: DataSource) => dataSource.getRepository(BlockoutModel),
          inject: [DataSource],
        },
        {
          provide: DataSource,
          useValue: dataSource,
        },
      ],
    }).compile();

    factory = module.get<BlockoutFactory>(BlockoutFactory);
    repository = module.get<Repository<BlockoutModel>>(getRepositoryToken(BlockoutModel));
  });

  afterAll(async () => {
    // Don't destroy shared DataSource - it's reused across tests
    await module.close();
  });

  beforeEach(async () => {
    await cleanDatabase(dataSource);
  });

  describe('loadById', () => {
    it('should return aggregate with business logic', async () => {
      // Arrange
      const id = generateTestId();
      const businessId = generateTestId();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30); // 30 days from now

      const blockoutModel = repository.create({
        id,
        businessId,
        startDate: futureDate,
        endDate: new Date(futureDate.getTime() + 7 * 24 * 60 * 60 * 1000), // +7 days
        reason: 'Summer vacation',
        createdAt: new Date('2024-01-01'),
      });
      await repository.save(blockoutModel);

      // Act
      const aggregate = await factory.loadById(id);

      // Assert
      expect(aggregate).toBeDefined();
      expect(aggregate).not.toBeNull();
      expect(aggregate!.getId().getValue()).toBe(id);
      expect(aggregate!.getBusinessId().getValue()).toBe(businessId);
      expect(aggregate!.getReason()).toBe('Summer vacation');
    });

    it('should return null for non-existent id', async () => {
      // Act
      const aggregate = await factory.loadById(generateTestId());

      // Assert
      expect(aggregate).toBeNull();
    });

    it('should load aggregate that can execute domain methods', async () => {
      // Arrange
      const id = generateTestId();
      const businessId = generateTestId();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 60); // 60 days from now

      const blockoutModel = repository.create({
        id,
        businessId,
        startDate: futureDate,
        endDate: new Date(futureDate.getTime() + 3 * 24 * 60 * 60 * 1000), // +3 days
        reason: 'Holiday',
        createdAt: new Date(),
      });
      await repository.save(blockoutModel);

      // Act
      const aggregate = await factory.loadById(id);

      // Assert - Verify aggregate has business logic methods
      expect(aggregate).toBeDefined();
      expect(typeof aggregate!.isDateBlocked).toBe('function');
      expect(typeof aggregate!.remove).toBe('function');
    });

    it('should handle single-day blockouts', async () => {
      // Arrange
      const id = generateTestId();
      const businessId = generateTestId();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 15); // 15 days from now

      const blockoutModel = repository.create({
        id,
        businessId,
        startDate: futureDate,
        endDate: futureDate, // Same day
        reason: 'Staff meeting',
        createdAt: new Date(),
      });
      await repository.save(blockoutModel);

      // Act
      const aggregate = await factory.loadById(id);

      // Assert
      expect(aggregate).toBeDefined();
      const dateRange = aggregate!.getDateRange();
      expect(dateRange.getStartDate().getTime()).toBe(dateRange.getEndDate().getTime());
    });

    it('should handle multi-day blockouts', async () => {
      // Arrange
      const id = generateTestId();
      const businessId = generateTestId();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 90); // 90 days from now
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 14); // +14 days (2 weeks)

      const blockoutModel = repository.create({
        id,
        businessId,
        startDate,
        endDate,
        reason: 'Extended vacation',
        createdAt: new Date(),
      });
      await repository.save(blockoutModel);

      // Act
      const aggregate = await factory.loadById(id);

      // Assert
      expect(aggregate).toBeDefined();
      const dateRange = aggregate!.getDateRange();
      const daysDiff = Math.floor(
        (dateRange.getEndDate().getTime() - dateRange.getStartDate().getTime()) /
          (1000 * 60 * 60 * 24),
      );
      expect(daysDiff).toBe(14);
    });

    it('should handle different blockout reasons', async () => {
      // Arrange
      const businessId = generateTestId();
      const testData = [
        {
          id: generateTestId(),
          reason: 'Public holiday',
          daysOffset: 30,
        },
        {
          id: generateTestId(),
          reason: 'Maintenance',
          daysOffset: 45,
        },
        {
          id: generateTestId(),
          reason: 'Private event',
          daysOffset: 60,
        },
        {
          id: generateTestId(),
          reason: 'Emergency closure',
          daysOffset: 75,
        },
      ];

      for (const { id, reason, daysOffset } of testData) {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + daysOffset);

        const model = repository.create({
          id,
          businessId,
          startDate: futureDate,
          endDate: futureDate,
          reason,
          createdAt: new Date(),
        });
        await repository.save(model);
      }

      // Act & Assert
      for (const { id, reason } of testData) {
        const aggregate = await factory.loadById(id);
        expect(aggregate).toBeDefined();
        expect(aggregate!.getReason()).toBe(reason);
      }
    });

    it('should preserve date precision from database', async () => {
      // Arrange - Create dates entirely in UTC
      const id = generateTestId();
      const businessId = generateTestId();
      const now = new Date();
      const startDate = new Date(
        Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          now.getUTCDate() + 100, // 100 days from now
          0,
          0,
          0,
          0,
        ),
      );

      const endDate = new Date(
        Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          now.getUTCDate() + 105, // +5 days from start
          0,
          0,
          0,
          0,
        ),
      );

      const blockoutModel = repository.create({
        id,
        businessId,
        startDate,
        endDate,
        reason: 'Scheduled maintenance',
        createdAt: new Date(),
      });
      await repository.save(blockoutModel);

      // Act
      const aggregate = await factory.loadById(id);

      // Assert - Verify dates are preserved (compare UTC timestamps)
      expect(aggregate).toBeDefined();
      const dateRange = aggregate!.getDateRange();

      // Compare UTC timestamps (should match exactly now)
      expect(dateRange.getStartDate().getTime()).toBe(startDate.getTime());
      expect(dateRange.getEndDate().getTime()).toBe(endDate.getTime());
    });

    it('should handle blockouts for different businesses', async () => {
      // Arrange
      const testData = [
        {
          id: generateTestId(),
          businessId: generateTestId(),
          daysOffset: 20,
        },
        {
          id: generateTestId(),
          businessId: generateTestId(),
          daysOffset: 25,
        },
        {
          id: generateTestId(),
          businessId: generateTestId(),
          daysOffset: 30,
        },
      ];

      for (const { id, businessId, daysOffset } of testData) {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + daysOffset);

        const model = repository.create({
          id,
          businessId,
          startDate: futureDate,
          endDate: futureDate,
          reason: 'Business-specific blockout',
          createdAt: new Date(),
        });
        await repository.save(model);
      }

      // Act & Assert
      for (const { id, businessId } of testData) {
        const aggregate = await factory.loadById(id);
        expect(aggregate).toBeDefined();
        expect(aggregate!.getBusinessId().getValue()).toBe(businessId);
      }
    });

    it('should verify isDateBlocked method works correctly', async () => {
      // Arrange - Create dates entirely in UTC
      const id = generateTestId();
      const businessId = generateTestId();
      const now = new Date();
      const startDate = new Date(
        Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          now.getUTCDate() + 50, // 50 days from now
          0,
          0,
          0,
          0,
        ),
      );

      const endDate = new Date(
        Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          now.getUTCDate() + 55, // +5 days from start
          0,
          0,
          0,
          0,
        ),
      );

      const blockoutModel = repository.create({
        id,
        businessId,
        startDate,
        endDate,
        reason: 'Test blockout',
        createdAt: new Date(),
      });
      await repository.save(blockoutModel);

      // Act
      const aggregate = await factory.loadById(id);

      // Assert - Test business logic
      expect(aggregate).toBeDefined();

      // Date within range should be blocked
      const midDate = new Date(
        Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          now.getUTCDate() + 52, // 2 days after start
          0,
          0,
          0,
          0,
        ),
      );
      expect(aggregate!.isDateBlocked(midDate)).toBe(true);

      // Date before range should not be blocked
      const beforeDate = new Date(
        Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          now.getUTCDate() + 49, // 1 day before start
          0,
          0,
          0,
          0,
        ),
      );
      expect(aggregate!.isDateBlocked(beforeDate)).toBe(false);

      // Date after range should not be blocked
      const afterDate = new Date(
        Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          now.getUTCDate() + 56, // 1 day after end
          0,
          0,
          0,
          0,
        ),
      );
      expect(aggregate!.isDateBlocked(afterDate)).toBe(false);
    });
  });
});

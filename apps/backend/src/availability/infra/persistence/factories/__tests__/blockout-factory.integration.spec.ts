import { Test, TestingModule } from '@nestjs/testing';
import { DataSource, Repository } from 'typeorm';
import { BlockoutFactory } from '../blockout-factory';
import { BlockoutModel } from '../../models/blockout';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('BlockoutFactory (Integration)', () => {
  let module: TestingModule;
  let factory: BlockoutFactory;
  let repository: Repository<BlockoutModel>;
  let dataSource: DataSource;

  beforeAll(async () => {
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
          useFactory: async () => {
            const AppDataSource = new DataSource({
              type: 'postgres',
              host: process.env.DB_HOST || 'localhost',
              port: parseInt(process.env.DB_PORT || '5432'),
              username: process.env.DB_USERNAME || 'postgres',
              password: process.env.DB_PASSWORD || 'postgres',
              database: process.env.DB_DATABASE || 'bookings_test',
              entities: [BlockoutModel],
              synchronize: true,
              dropSchema: true,
            });
            return AppDataSource.initialize();
          },
        },
      ],
    }).compile();

    factory = module.get<BlockoutFactory>(BlockoutFactory);
    repository = module.get<Repository<BlockoutModel>>(getRepositoryToken(BlockoutModel));
    dataSource = module.get<DataSource>(DataSource);
  });

  afterAll(async () => {
    await dataSource.destroy();
    await module.close();
  });

  beforeEach(async () => {
    await repository.clear();
  });

  describe('loadById', () => {
    it('should return aggregate with business logic', async () => {
      // Arrange
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30); // 30 days from now

      const blockoutModel = repository.create({
        id: '550e8400-e29b-41d4-a716-446655440000',
        businessId: '550e8400-e29b-41d4-a716-446655440001',
        startDate: futureDate,
        endDate: new Date(futureDate.getTime() + 7 * 24 * 60 * 60 * 1000), // +7 days
        reason: 'Summer vacation',
        createdAt: new Date('2024-01-01'),
      });
      await repository.save(blockoutModel);

      // Act
      const aggregate = await factory.loadById('550e8400-e29b-41d4-a716-446655440000');

      // Assert
      expect(aggregate).toBeDefined();
      expect(aggregate).not.toBeNull();
      expect(aggregate!.getId().getValue()).toBe('550e8400-e29b-41d4-a716-446655440000');
      expect(aggregate!.getBusinessId().getValue()).toBe('550e8400-e29b-41d4-a716-446655440001');
      expect(aggregate!.getReason()).toBe('Summer vacation');
    });

    it('should return null for non-existent id', async () => {
      // Act
      const aggregate = await factory.loadById('11111111-1111-1111-1111-111111111111');

      // Assert
      expect(aggregate).toBeNull();
    });

    it('should load aggregate that can execute domain methods', async () => {
      // Arrange
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 60); // 60 days from now

      const blockoutModel = repository.create({
        id: '550e8400-e29b-41d4-a716-446655440002',
        businessId: '550e8400-e29b-41d4-a716-446655440003',
        startDate: futureDate,
        endDate: new Date(futureDate.getTime() + 3 * 24 * 60 * 60 * 1000), // +3 days
        reason: 'Holiday',
        createdAt: new Date(),
      });
      await repository.save(blockoutModel);

      // Act
      const aggregate = await factory.loadById('550e8400-e29b-41d4-a716-446655440002');

      // Assert - Verify aggregate has business logic methods
      expect(aggregate).toBeDefined();
      expect(typeof aggregate!.isDateBlocked).toBe('function');
      expect(typeof aggregate!.remove).toBe('function');
    });

    it('should handle single-day blockouts', async () => {
      // Arrange
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 15); // 15 days from now

      const blockoutModel = repository.create({
        id: '550e8400-e29b-41d4-a716-446655440010',
        businessId: '550e8400-e29b-41d4-a716-446655440100',
        startDate: futureDate,
        endDate: futureDate, // Same day
        reason: 'Staff meeting',
        createdAt: new Date(),
      });
      await repository.save(blockoutModel);

      // Act
      const aggregate = await factory.loadById('550e8400-e29b-41d4-a716-446655440010');

      // Assert
      expect(aggregate).toBeDefined();
      const dateRange = aggregate!.getDateRange();
      expect(dateRange.getStartDate().getTime()).toBe(dateRange.getEndDate().getTime());
    });

    it('should handle multi-day blockouts', async () => {
      // Arrange
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 90); // 90 days from now
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 14); // +14 days (2 weeks)

      const blockoutModel = repository.create({
        id: '550e8400-e29b-41d4-a716-446655440011',
        businessId: '550e8400-e29b-41d4-a716-446655440101',
        startDate,
        endDate,
        reason: 'Extended vacation',
        createdAt: new Date(),
      });
      await repository.save(blockoutModel);

      // Act
      const aggregate = await factory.loadById('550e8400-e29b-41d4-a716-446655440011');

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
      const testData = [
        {
          id: '550e8400-e29b-41d4-a716-446655440020',
          reason: 'Public holiday',
          daysOffset: 30,
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440021',
          reason: 'Maintenance',
          daysOffset: 45,
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440022',
          reason: 'Private event',
          daysOffset: 60,
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440023',
          reason: 'Emergency closure',
          daysOffset: 75,
        },
      ];

      for (const { id, reason, daysOffset } of testData) {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + daysOffset);

        const model = repository.create({
          id,
          businessId: '550e8400-e29b-41d4-a716-446655440200',
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
      // Arrange
      const startDate = new Date('2025-06-15T00:00:00.000Z');
      const endDate = new Date('2025-06-20T00:00:00.000Z');

      const blockoutModel = repository.create({
        id: '550e8400-e29b-41d4-a716-446655440030',
        businessId: '550e8400-e29b-41d4-a716-446655440300',
        startDate,
        endDate,
        reason: 'Scheduled maintenance',
        createdAt: new Date(),
      });
      await repository.save(blockoutModel);

      // Act
      const aggregate = await factory.loadById('550e8400-e29b-41d4-a716-446655440030');

      // Assert
      expect(aggregate).toBeDefined();
      const dateRange = aggregate!.getDateRange();
      expect(dateRange.getStartDate().toISOString()).toBe(startDate.toISOString());
      expect(dateRange.getEndDate().toISOString()).toBe(endDate.toISOString());
    });

    it('should handle blockouts for different businesses', async () => {
      // Arrange
      const testData = [
        {
          id: '550e8400-e29b-41d4-a716-446655440040',
          businessId: '550e8400-e29b-41d4-a716-446655440400',
          daysOffset: 20,
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440041',
          businessId: '550e8400-e29b-41d4-a716-446655440401',
          daysOffset: 25,
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440042',
          businessId: '550e8400-e29b-41d4-a716-446655440402',
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
      // Arrange
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 50); // 50 days from now
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 5); // +5 days

      const blockoutModel = repository.create({
        id: '550e8400-e29b-41d4-a716-446655440050',
        businessId: '550e8400-e29b-41d4-a716-446655440500',
        startDate,
        endDate,
        reason: 'Test blockout',
        createdAt: new Date(),
      });
      await repository.save(blockoutModel);

      // Act
      const aggregate = await factory.loadById('550e8400-e29b-41d4-a716-446655440050');

      // Assert - Test business logic
      expect(aggregate).toBeDefined();

      // Date within range should be blocked
      const midDate = new Date(startDate);
      midDate.setDate(midDate.getDate() + 2);
      expect(aggregate!.isDateBlocked(midDate)).toBe(true);

      // Date before range should not be blocked
      const beforeDate = new Date(startDate);
      beforeDate.setDate(beforeDate.getDate() - 1);
      expect(aggregate!.isDateBlocked(beforeDate)).toBe(false);

      // Date after range should not be blocked
      const afterDate = new Date(endDate);
      afterDate.setDate(afterDate.getDate() + 1);
      expect(aggregate!.isDateBlocked(afterDate)).toBe(false);
    });
  });
});

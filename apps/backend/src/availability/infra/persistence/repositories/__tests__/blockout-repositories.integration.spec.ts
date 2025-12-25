import { Test, TestingModule } from '@nestjs/testing';
import { DataSource, Repository } from 'typeorm';
import { BlockoutWriteRepository } from '../blockout-write';
import { BlockoutReadRepository } from '../blockout-read';
import { BlockoutModel } from '../../models/blockout';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Blockout } from '@availability/domain/aggregates/blockout';
import { UUID } from '@shared/vo/uuid';
import { DateRange } from '@availability/domain/vo/date-range.vo';
import { TypeOrmUnitOfWork } from '@shared/infra/uow';
import {
  createIntegrationTestDataSource,
  cleanDatabase,
  generateTestId,
} from '@test-utils/integration-test-helper';

describe('Blockout Repositories (Integration)', () => {
  let module: TestingModule;
  let writeRepo: BlockoutWriteRepository;
  let readRepo: BlockoutReadRepository;
  let repository: Repository<BlockoutModel>;
  let dataSource: DataSource;
  let uow: TypeOrmUnitOfWork;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      providers: [
        BlockoutWriteRepository,
        BlockoutReadRepository,
        TypeOrmUnitOfWork,
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
              database: process.env.DB_DATABASE || 'postgres_test',
              entities: [BlockoutModel],
              synchronize: false,
              dropSchema: true,
            });
            return AppDataSource.initialize();
          },
        },
      ],
    }).compile();

    writeRepo = module.get<BlockoutWriteRepository>(BlockoutWriteRepository);
    readRepo = module.get<BlockoutReadRepository>(BlockoutReadRepository);
    repository = module.get<Repository<BlockoutModel>>(getRepositoryToken(BlockoutModel));
    dataSource = module.get<DataSource>(DataSource);
    uow = module.get<TypeOrmUnitOfWork>(TypeOrmUnitOfWork);
  });

  afterAll(async () => {
    await dataSource.destroy();
    await module.close();
  });

  beforeEach(async () => {
    await repository.clear();
  });

  describe('BlockoutWriteRepository', () => {
    describe('save', () => {
      it('should persist a new blockout aggregate', async () => {
        // Arrange
        const startDate = new Date();
        startDate.setDate(startDate.getDate() + 30); // 30 days from now
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 7); // +7 days

        const blockout = Blockout.create(
          UUID.generate(),
          UUID.generate(),
          DateRange.create(startDate, endDate),
          'Summer vacation',
        );

        // Act
        await writeRepo.save(blockout);

        // Assert
        const saved = await repository.findOne({
          where: { id: blockout.getId().getValue() },
        });
        expect(saved).toBeDefined();
        expect(saved!.businessId).toBe(blockout.getBusinessId().getValue());
        expect(saved!.reason).toBe('Summer vacation');
        expect(saved!.startDate.toISOString()).toBe(startDate.toISOString());
        expect(saved!.endDate.toISOString()).toBe(endDate.toISOString());
      });

      it('should handle single-day blockouts', async () => {
        // Arrange
        const date = new Date();
        date.setDate(date.getDate() + 15); // 15 days from now

        const blockout = Blockout.create(
          UUID.generate(),
          UUID.generate(),
          DateRange.create(date, date), // Same day
          'Staff meeting',
        );

        // Act
        await writeRepo.save(blockout);

        // Assert
        const saved = await repository.findOne({
          where: { id: blockout.getId().getValue() },
        });
        expect(saved).toBeDefined();
        expect(saved!.startDate.toISOString()).toBe(saved!.endDate.toISOString());
      });

      it('should handle multi-day blockouts', async () => {
        // Arrange
        const startDate = new Date();
        startDate.setDate(startDate.getDate() + 60); // 60 days from now
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 14); // +14 days

        const blockout = Blockout.create(
          UUID.generate(),
          UUID.generate(),
          DateRange.create(startDate, endDate),
          'Extended vacation',
        );

        // Act
        await writeRepo.save(blockout);

        // Assert
        const saved = await repository.findOne({
          where: { id: blockout.getId().getValue() },
        });
        expect(saved).toBeDefined();
        const daysDiff = Math.floor(
          (saved!.endDate.getTime() - saved!.startDate.getTime()) / (1000 * 60 * 60 * 24),
        );
        expect(daysDiff).toBe(14);
      });

      it('should work within a transaction', async () => {
        // Arrange
        const startDate = new Date();
        startDate.setDate(startDate.getDate() + 45); // 45 days from now
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 3); // +3 days

        const blockout = Blockout.create(
          UUID.generate(),
          UUID.generate(),
          DateRange.create(startDate, endDate),
          'Holiday',
        );

        // Act
        await uow.transaction(async () => {
          await writeRepo.save(blockout);
        });

        // Assert
        const saved = await repository.findOne({
          where: { id: blockout.getId().getValue() },
        });
        expect(saved).toBeDefined();
      });
    });

    describe('delete', () => {
      it('should delete an existing blockout', async () => {
        // Arrange
        const startDate = new Date();
        startDate.setDate(startDate.getDate() + 20); // 20 days from now
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 2); // +2 days

        const blockout = Blockout.create(
          UUID.generate(),
          UUID.generate(),
          DateRange.create(startDate, endDate),
          'Temporary closure',
        );
        await writeRepo.save(blockout);

        // Act
        await writeRepo.delete(blockout.getId().getValue());

        // Assert
        const deleted = await repository.findOne({
          where: { id: blockout.getId().getValue() },
        });
        expect(deleted).toBeNull();
      });

      it('should not throw error when deleting non-existent blockout', async () => {
        // Act & Assert
        await expect(
          writeRepo.delete('11111111-1111-1111-1111-111111111111'),
        ).resolves.not.toThrow();
      });
    });
  });

  describe('BlockoutReadRepository', () => {
    describe('findById', () => {
      it('should return read model for existing blockout', async () => {
        // Arrange
        const startDate = new Date();
        startDate.setDate(startDate.getDate() + 30);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 5);

        const blockoutModel = repository.create({
          id: '550e8400-e29b-41d4-a716-446655440000',
          businessId: '550e8400-e29b-41d4-a716-446655440001',
          startDate,
          endDate,
          reason: 'Test blockout',
          createdAt: new Date(),
        });
        await repository.save(blockoutModel);

        // Act
        const readModel = await readRepo.findById('550e8400-e29b-41d4-a716-446655440000');

        // Assert
        expect(readModel).toBeDefined();
        expect(readModel!.id).toBe('550e8400-e29b-41d4-a716-446655440000');
        expect(readModel!.businessId).toBe('550e8400-e29b-41d4-a716-446655440001');
        expect(readModel!.reason).toBe('Test blockout');
      });

      it('should return null for non-existent id', async () => {
        // Act
        const readModel = await readRepo.findById('11111111-1111-1111-1111-111111111111');

        // Assert
        expect(readModel).toBeNull();
      });
    });

    describe('findByBusinessId', () => {
      it('should return all blockouts for a business', async () => {
        // Arrange
        const businessId = '550e8400-e29b-41d4-a716-446655440100';

        // Create multiple blockouts
        const blockouts = [
          {
            id: '550e8400-e29b-41d4-a716-446655440010',
            startOffset: 10,
            duration: 1,
            reason: 'Holiday 1',
          },
          {
            id: '550e8400-e29b-41d4-a716-446655440011',
            startOffset: 20,
            duration: 3,
            reason: 'Holiday 2',
          },
          {
            id: '550e8400-e29b-41d4-a716-446655440012',
            startOffset: 30,
            duration: 7,
            reason: 'Vacation',
          },
        ];

        for (const blockout of blockouts) {
          const startDate = new Date();
          startDate.setDate(startDate.getDate() + blockout.startOffset);
          const endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + blockout.duration);

          const model = repository.create({
            id: blockout.id,
            businessId,
            startDate,
            endDate,
            reason: blockout.reason,
            createdAt: new Date(),
          });
          await repository.save(model);
        }

        // Act
        const readModels = await readRepo.findByBusinessId(businessId);

        // Assert
        expect(readModels).toHaveLength(3);
        expect(readModels.map((rm) => rm.reason).sort()).toEqual([
          'Holiday 1',
          'Holiday 2',
          'Vacation',
        ]);
      });

      it('should return empty array when no blockouts exist', async () => {
        // Act
        const readModels = await readRepo.findByBusinessId('550e8400-e29b-41d4-a716-446655440200');

        // Assert
        expect(readModels).toEqual([]);
      });

      it('should only return blockouts for specified business', async () => {
        // Arrange
        const business1 = '550e8400-e29b-41d4-a716-446655440300';
        const business2 = '550e8400-e29b-41d4-a716-446655440301';

        const startDate = new Date();
        startDate.setDate(startDate.getDate() + 40);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 2);

        // Create blockouts for both businesses
        await repository.save([
          repository.create({
            id: '550e8400-e29b-41d4-a716-446655440020',
            businessId: business1,
            startDate,
            endDate,
            reason: 'Business 1 blockout',
            createdAt: new Date(),
          }),
          repository.create({
            id: '550e8400-e29b-41d4-a716-446655440021',
            businessId: business2,
            startDate,
            endDate,
            reason: 'Business 2 blockout',
            createdAt: new Date(),
          }),
        ]);

        // Act
        const readModels = await readRepo.findByBusinessId(business1);

        // Assert
        expect(readModels).toHaveLength(1);
        expect(readModels[0].businessId).toBe(business1);
      });
    });

    describe('findByBusinessAndDateRange', () => {
      it('should return blockouts within date range', async () => {
        // Arrange
        const businessId = '550e8400-e29b-41d4-a716-446655440400';

        // Create blockout from day 30 to day 35
        const blockoutStart = new Date();
        blockoutStart.setDate(blockoutStart.getDate() + 30);
        const blockoutEnd = new Date(blockoutStart);
        blockoutEnd.setDate(blockoutEnd.getDate() + 5);

        const blockoutModel = repository.create({
          id: '550e8400-e29b-41d4-a716-446655440030',
          businessId,
          startDate: blockoutStart,
          endDate: blockoutEnd,
          reason: 'Test blockout',
          createdAt: new Date(),
        });
        await repository.save(blockoutModel);

        // Act - Query overlapping range (day 28 to day 32)
        const queryStart = new Date();
        queryStart.setDate(queryStart.getDate() + 28);
        const queryEnd = new Date();
        queryEnd.setDate(queryEnd.getDate() + 32);

        const readModels = await readRepo.findByBusinessAndDateRange(
          businessId,
          queryStart,
          queryEnd,
        );

        // Assert
        expect(readModels).toHaveLength(1);
        expect(readModels[0].id).toBe('550e8400-e29b-41d4-a716-446655440030');
      });

      it('should return empty array when no blockouts overlap', async () => {
        // Arrange
        const businessId = '550e8400-e29b-41d4-a716-446655440500';

        // Create blockout from day 50 to day 55
        const blockoutStart = new Date();
        blockoutStart.setDate(blockoutStart.getDate() + 50);
        const blockoutEnd = new Date(blockoutStart);
        blockoutEnd.setDate(blockoutEnd.getDate() + 5);

        const blockoutModel = repository.create({
          id: '550e8400-e29b-41d4-a716-446655440040',
          businessId,
          startDate: blockoutStart,
          endDate: blockoutEnd,
          reason: 'Test blockout',
          createdAt: new Date(),
        });
        await repository.save(blockoutModel);

        // Act - Query non-overlapping range (day 10 to day 20)
        const queryStart = new Date();
        queryStart.setDate(queryStart.getDate() + 10);
        const queryEnd = new Date();
        queryEnd.setDate(queryEnd.getDate() + 20);

        const readModels = await readRepo.findByBusinessAndDateRange(
          businessId,
          queryStart,
          queryEnd,
        );

        // Assert
        expect(readModels).toEqual([]);
      });

      it('should return multiple overlapping blockouts', async () => {
        // Arrange
        const businessId = '550e8400-e29b-41d4-a716-446655440600';

        // Create 3 blockouts with different overlaps
        const blockouts = [
          {
            id: '550e8400-e29b-41d4-a716-446655440050',
            startOffset: 25,
            duration: 5,
            reason: 'Blockout 1',
          },
          {
            id: '550e8400-e29b-41d4-a716-446655440051',
            startOffset: 35,
            duration: 5,
            reason: 'Blockout 2',
          },
          {
            id: '550e8400-e29b-41d4-a716-446655440052',
            startOffset: 45,
            duration: 5,
            reason: 'Blockout 3',
          },
        ];

        for (const blockout of blockouts) {
          const startDate = new Date();
          startDate.setDate(startDate.getDate() + blockout.startOffset);
          const endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + blockout.duration);

          const model = repository.create({
            id: blockout.id,
            businessId,
            startDate,
            endDate,
            reason: blockout.reason,
            createdAt: new Date(),
          });
          await repository.save(model);
        }

        // Act - Query range that overlaps all 3 (day 20 to day 50)
        const queryStart = new Date();
        queryStart.setDate(queryStart.getDate() + 20);
        const queryEnd = new Date();
        queryEnd.setDate(queryEnd.getDate() + 50);

        const readModels = await readRepo.findByBusinessAndDateRange(
          businessId,
          queryStart,
          queryEnd,
        );

        // Assert
        expect(readModels).toHaveLength(3);
      });

      it('should handle exact date match', async () => {
        // Arrange
        const businessId = '550e8400-e29b-41d4-a716-446655440700';

        const date = new Date();
        date.setDate(date.getDate() + 60);

        const blockoutModel = repository.create({
          id: '550e8400-e29b-41d4-a716-446655440060',
          businessId,
          startDate: date,
          endDate: date, // Single day
          reason: 'Single day blockout',
          createdAt: new Date(),
        });
        await repository.save(blockoutModel);

        // Act - Query exact same date
        const readModels = await readRepo.findByBusinessAndDateRange(businessId, date, date);

        // Assert
        expect(readModels).toHaveLength(1);
        expect(readModels[0].id).toBe('550e8400-e29b-41d4-a716-446655440060');
      });
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { OfferingReadRepository } from '../offering-read';
import { OfferingModel } from '../../models/offering';
import { UUID } from '@shared/vo/uuid';

describe('OfferingReadRepository Integration Tests', () => {
  let module: TestingModule;
  let repository: OfferingReadRepository;
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
          entities: [OfferingModel],
          synchronize: true,
          dropSchema: false,
        }),
        TypeOrmModule.forFeature([OfferingModel]),
      ],
      providers: [OfferingReadRepository],
    }).compile();

    repository = module.get<OfferingReadRepository>(OfferingReadRepository);
    dataSource = module.get<DataSource>(DataSource);
  }, 30000);

  afterAll(async () => {
    await dataSource.destroy();
    await module.close();
  });

  afterEach(async () => {
    await dataSource.getRepository(OfferingModel).clear();
  });

  describe('findById', () => {
    it('should return read model when offering exists', async () => {
      // Arrange
      const id = UUID.generate().getValue();
      const businessId = UUID.generate().getValue();

      await dataSource.getRepository(OfferingModel).insert({
        id,
        businessId,
        name: 'Test Offering',
        duration: 30,
        maxCapacityPerSlot: 5,
        maxDailyCapacity: 20,
        isActive: true,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Act
      const readModel = await repository.findById(id);

      // Assert
      expect(readModel).toBeDefined();
      expect(readModel!.id).toBe(id);
      expect(readModel!.businessId).toBe(businessId);
      expect(readModel!.name).toBe('Test Offering');
      expect(readModel!.duration).toBe(30);
      expect(readModel!.maxCapacityPerSlot).toBe(5);
      expect(readModel!.maxDailyCapacity).toBe(20);
      expect(readModel!.isActive).toBe(true);
    });

    it('should return null when offering does not exist', async () => {
      // Arrange
      const nonExistentId = UUID.generate().getValue();

      // Act
      const readModel = await repository.findById(nonExistentId);

      // Assert
      expect(readModel).toBeNull();
    });
  });

  describe('findActiveByBusinessId', () => {
    it('should return only active offerings', async () => {
      // Arrange
      const businessId = UUID.generate().getValue();

      await dataSource.getRepository(OfferingModel).insert([
        {
          id: UUID.generate().getValue(),
          businessId,
          name: 'Active Offering 1',
          duration: 30,
          maxCapacityPerSlot: 5,
          maxDailyCapacity: null,
          isActive: true,
          version: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: UUID.generate().getValue(),
          businessId,
          name: 'Inactive Offering',
          duration: 45,
          maxCapacityPerSlot: 3,
          maxDailyCapacity: null,
          isActive: false,
          version: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: UUID.generate().getValue(),
          businessId,
          name: 'Active Offering 2',
          duration: 60,
          maxCapacityPerSlot: 2,
          maxDailyCapacity: 10,
          isActive: true,
          version: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      // Act
      const offerings = await repository.findActiveByBusinessId(businessId);

      // Assert
      expect(offerings).toHaveLength(2);
      expect(offerings.every((o) => o.isActive)).toBe(true);
      expect(offerings.every((o) => o.businessId === businessId)).toBe(true);
    });

    it('should return empty array when no active offerings exist', async () => {
      // Arrange
      const businessId = UUID.generate().getValue();

      await dataSource.getRepository(OfferingModel).insert({
        id: UUID.generate().getValue(),
        businessId,
        name: 'Inactive Offering',
        duration: 30,
        maxCapacityPerSlot: 5,
        maxDailyCapacity: null,
        isActive: false,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Act
      const offerings = await repository.findActiveByBusinessId(businessId);

      // Assert
      expect(offerings).toHaveLength(0);
    });

    it('should return offerings sorted alphabetically by name', async () => {
      // Arrange
      const businessId = UUID.generate().getValue();

      await dataSource.getRepository(OfferingModel).insert([
        {
          id: UUID.generate().getValue(),
          businessId,
          name: 'Zebra Service',
          duration: 30,
          maxCapacityPerSlot: 5,
          maxDailyCapacity: null,
          isActive: true,
          version: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: UUID.generate().getValue(),
          businessId,
          name: 'Apple Service',
          duration: 45,
          maxCapacityPerSlot: 3,
          maxDailyCapacity: null,
          isActive: true,
          version: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: UUID.generate().getValue(),
          businessId,
          name: 'Mango Service',
          duration: 60,
          maxCapacityPerSlot: 2,
          maxDailyCapacity: null,
          isActive: true,
          version: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      // Act
      const offerings = await repository.findActiveByBusinessId(businessId);

      // Assert
      expect(offerings).toHaveLength(3);
      expect(offerings[0].name).toBe('Apple Service');
      expect(offerings[1].name).toBe('Mango Service');
      expect(offerings[2].name).toBe('Zebra Service');
    });
  });

  describe('findByBusinessId', () => {
    it('should return all offerings including inactive ones', async () => {
      // Arrange
      const businessId = UUID.generate().getValue();

      await dataSource.getRepository(OfferingModel).insert([
        {
          id: UUID.generate().getValue(),
          businessId,
          name: 'Active Offering',
          duration: 30,
          maxCapacityPerSlot: 5,
          maxDailyCapacity: null,
          isActive: true,
          version: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: UUID.generate().getValue(),
          businessId,
          name: 'Inactive Offering',
          duration: 45,
          maxCapacityPerSlot: 3,
          maxDailyCapacity: null,
          isActive: false,
          version: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      // Act
      const offerings = await repository.findByBusinessId(businessId);

      // Assert
      expect(offerings).toHaveLength(2);
      expect(offerings.some((o) => o.isActive)).toBe(true);
      expect(offerings.some((o) => !o.isActive)).toBe(true);
    });

    it('should return offerings sorted alphabetically by name', async () => {
      // Arrange
      const businessId = UUID.generate().getValue();

      await dataSource.getRepository(OfferingModel).insert([
        {
          id: UUID.generate().getValue(),
          businessId,
          name: 'Zebra Service',
          duration: 30,
          maxCapacityPerSlot: 5,
          maxDailyCapacity: null,
          isActive: true,
          version: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: UUID.generate().getValue(),
          businessId,
          name: 'Apple Service',
          duration: 45,
          maxCapacityPerSlot: 3,
          maxDailyCapacity: null,
          isActive: false,
          version: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      // Act
      const offerings = await repository.findByBusinessId(businessId);

      // Assert
      expect(offerings).toHaveLength(2);
      expect(offerings[0].name).toBe('Apple Service');
      expect(offerings[1].name).toBe('Zebra Service');
    });

    it('should not return offerings from other businesses', async () => {
      // Arrange
      const businessId1 = UUID.generate().getValue();
      const businessId2 = UUID.generate().getValue();

      await dataSource.getRepository(OfferingModel).insert([
        {
          id: UUID.generate().getValue(),
          businessId: businessId1,
          name: 'Business 1 Offering',
          duration: 30,
          maxCapacityPerSlot: 5,
          maxDailyCapacity: null,
          isActive: true,
          version: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: UUID.generate().getValue(),
          businessId: businessId2,
          name: 'Business 2 Offering',
          duration: 45,
          maxCapacityPerSlot: 3,
          maxDailyCapacity: null,
          isActive: true,
          version: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      // Act
      const offerings = await repository.findByBusinessId(businessId1);

      // Assert
      expect(offerings).toHaveLength(1);
      expect(offerings[0].businessId).toBe(businessId1);
      expect(offerings[0].name).toBe('Business 1 Offering');
    });
  });
});

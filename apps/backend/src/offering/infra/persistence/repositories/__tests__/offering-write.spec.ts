import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { OfferingWriteRepository } from '../offering-write';
import { OfferingModel } from '../../models/offering';
import { Offering } from '@offering/domain/aggregates/offering';
import { UUID } from '@shared/vo/uuid';
import { OfferingDuration } from '@offering/domain/vo/offering-duration';
import { ConcurrencyException } from '@shared/kernel/exceptions/concurrency';
import { TypeOrmUnitOfWork } from '@shared/infra/uow';
import { cleanDatabase } from '../../../../../../test/setup-db';

describe('OfferingWriteRepository Integration Tests', () => {
  let module: TestingModule;
  let repository: OfferingWriteRepository;
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
          synchronize: true, // Solo para tests
          dropSchema: false, // No eliminar el schema en cada test
        }),
        TypeOrmModule.forFeature([OfferingModel]),
      ],
      providers: [
        OfferingWriteRepository,
        {
          provide: 'IUnitOfWork',
          useClass: TypeOrmUnitOfWork,
        },
      ],
    }).compile();

    repository = module.get<OfferingWriteRepository>(OfferingWriteRepository);
    dataSource = module.get<DataSource>(DataSource);
  }, 30000); // Aumentar timeout a 30 segundos

  afterAll(async () => {
    await dataSource.destroy();
    await module.close();
  });

  beforeEach(async () => {
    // Usar helper optimizado para limpiar tablas
    await cleanDatabase(dataSource);
  });

  describe('save', () => {
    it('should create offering in database', async () => {
      // Arrange
      const offering = Offering.create(
        UUID.generate(),
        UUID.generate(),
        'Corte de Pelo',
        OfferingDuration.fromMinutes(30),
        4,
        20,
      );

      // Act
      await repository.save(offering);

      // Assert
      const saved = await dataSource.getRepository(OfferingModel).findOne({
        where: { id: offering.getId().getValue() },
      });

      expect(saved).toBeDefined();
      expect(saved!.name).toBe('Corte de Pelo');
      expect(saved!.duration).toBe(30);
      expect(saved!.maxCapacityPerSlot).toBe(4);
      expect(saved!.maxDailyCapacity).toBe(20);
      expect(saved!.isActive).toBe(true);
      expect(saved!.version).toBe(1);
    });

    it('should update existing offering', async () => {
      // Arrange
      const offering = Offering.create(
        UUID.generate(),
        UUID.generate(),
        'Corte de Pelo',
        OfferingDuration.fromMinutes(30),
        4,
        20,
      );

      await repository.save(offering);

      // Modificar el offering
      offering.update(
        'Corte Premium',
        OfferingDuration.fromMinutes(45),
        2,
        10,
      );

      // Act
      await repository.save(offering);

      // Assert
      const updated = await dataSource.getRepository(OfferingModel).findOne({
        where: { id: offering.getId().getValue() },
      });

      expect(updated).toBeDefined();
      expect(updated!.name).toBe('Corte Premium');
      expect(updated!.duration).toBe(45);
      expect(updated!.maxCapacityPerSlot).toBe(2);
      expect(updated!.maxDailyCapacity).toBe(10);
      expect(updated!.version).toBe(2); // Version 1 (create) + 1 (update)
    });

    it('should throw ConcurrencyException when version is incorrect', async () => {
      // Arrange
      const offering = Offering.create(
        UUID.generate(),
        UUID.generate(),
        'Corte de Pelo',
        OfferingDuration.fromMinutes(30),
        4,
        20,
      );

      await repository.save(offering);

      // Simular que otro proceso modificó el offering
      await dataSource
        .getRepository(OfferingModel)
        .update({ id: offering.getId().getValue() }, { version: 5 });

      // Intentar actualizar con versión desactualizada
      offering.update(
        'Corte Premium',
        OfferingDuration.fromMinutes(45),
        2,
        10,
      );

      // Act & Assert
      await expect(repository.save(offering)).rejects.toThrow(ConcurrencyException);
    });
  });

  describe('findById', () => {
    it('should return aggregate correctly hydrated', async () => {
      // Arrange
      const id = UUID.generate();
      const businessId = UUID.generate();

      await dataSource.getRepository(OfferingModel).insert({
        id: id.getValue(),
        businessId: businessId.getValue(),
        name: 'Corte de Pelo',
        duration: 30,
        maxCapacityPerSlot: 4,
        maxDailyCapacity: 20,
        isActive: true,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Act
      const offering = await repository.findById(id);

      // Assert
      expect(offering).toBeDefined();
      expect(offering!.getId().getValue()).toBe(id.getValue());
      expect(offering!.getBusinessId().getValue()).toBe(businessId.getValue());
      expect(offering!.getName()).toBe('Corte de Pelo');
      expect(offering!.getDuration().getMinutes()).toBe(30);
      expect(offering!.getMaxCapacityPerSlot()).toBe(4);
      expect(offering!.getMaxDailyCapacity()).toBe(20);
      expect(offering!.isActiveOffering()).toBe(true);
      expect(offering!.getVersion().getValue()).toBe(1);
    });

    it('should return null when offering does not exist', async () => {
      // Act
      const offering = await repository.findById(UUID.generate());

      // Assert
      expect(offering).toBeNull();
    });
  });

  describe('findByBusinessIdAndName', () => {
    it('should return offering when name exists for business', async () => {
      // Arrange
      const businessId = UUID.generate();
      const offering = Offering.create(
        UUID.generate(),
        businessId,
        'Corte de Pelo',
        OfferingDuration.fromMinutes(30),
        4,
        20,
      );

      await repository.save(offering);

      // Act
      const found = await repository.findByBusinessIdAndName(businessId, 'Corte de Pelo');

      // Assert
      expect(found).toBeDefined();
      expect(found!.getId().getValue()).toBe(offering.getId().getValue());
      expect(found!.getName()).toBe('Corte de Pelo');
    });

    it('should return null when name does not exist for business', async () => {
      // Arrange
      const businessId = UUID.generate();

      // Act
      const found = await repository.findByBusinessIdAndName(businessId, 'Servicio Inexistente');

      // Assert
      expect(found).toBeNull();
    });

    it('should return null when name exists for different business', async () => {
      // Arrange
      const businessId1 = UUID.generate();
      const businessId2 = UUID.generate();

      const offering = Offering.create(
        UUID.generate(),
        businessId1,
        'Corte de Pelo',
        OfferingDuration.fromMinutes(30),
        4,
        20,
      );

      await repository.save(offering);

      // Act
      const found = await repository.findByBusinessIdAndName(businessId2, 'Corte de Pelo');

      // Assert
      expect(found).toBeNull();
    });
  });
});

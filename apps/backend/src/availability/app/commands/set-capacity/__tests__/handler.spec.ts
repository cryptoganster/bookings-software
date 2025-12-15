import { Test, TestingModule } from '@nestjs/testing';
import { SetCapacityHandler } from '../handler';
import { SetCapacityCommand } from '../command';
import { ICapacityFactory } from '@availability/domain/interfaces/factories/capacity-factory';
import { ICapacityWriteRepository } from '@availability/domain/interfaces/repositories/capacity-write';
import { IUnitOfWork } from '@shared/kernel/uow';
import { Capacity } from '@availability/domain/aggregates/capacity';
import { UUID } from '@shared/vo/uuid';

describe('SetCapacityHandler', () => {
  let handler: SetCapacityHandler;
  let mockCapacityFactory: jest.Mocked<ICapacityFactory>;
  let mockCapacityWriteRepository: jest.Mocked<ICapacityWriteRepository>;
  let mockUow: jest.Mocked<IUnitOfWork>;

  beforeEach(async () => {
    // Crear mocks
    mockCapacityFactory = {
      loadByOfferingAndDate: jest.fn(),
      loadById: jest.fn(),
    };

    mockCapacityWriteRepository = {
      save: jest.fn(),
    };

    mockUow = {
      transaction: jest.fn(<T>(work: () => Promise<T>) => work()) as any,
      getQueryRunner: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SetCapacityHandler,
        {
          provide: 'ICapacityFactory',
          useValue: mockCapacityFactory,
        },
        {
          provide: 'ICapacityWriteRepository',
          useValue: mockCapacityWriteRepository,
        },
        {
          provide: 'IUnitOfWork',
          useValue: mockUow,
        },
      ],
    }).compile();

    handler = module.get<SetCapacityHandler>(SetCapacityHandler);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('when capacity does not exist', () => {
    it('should create new capacity', async () => {
      // Arrange
      const offeringId = UUID.generate().getValue();
      const date = new Date();
      date.setDate(date.getDate() + 7); // 7 días en el futuro
      const totalSlots = 10;
      const command = new SetCapacityCommand(offeringId, date, totalSlots);

      mockCapacityFactory.loadByOfferingAndDate.mockResolvedValue(null);

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result.capacityId).toBeDefined();
      expect(mockCapacityFactory.loadByOfferingAndDate).toHaveBeenCalledWith(offeringId, date);
      expect(mockCapacityWriteRepository.save).toHaveBeenCalledTimes(1);
      expect(mockUow.transaction).toHaveBeenCalledTimes(1);
    });

    it('should create capacity with correct values', async () => {
      // Arrange
      const offeringId = UUID.generate().getValue();
      const date = new Date();
      date.setDate(date.getDate() + 7); // 7 días en el futuro
      const totalSlots = 15;
      const command = new SetCapacityCommand(offeringId, date, totalSlots);

      mockCapacityFactory.loadByOfferingAndDate.mockResolvedValue(null);

      let savedCapacity: Capacity | undefined;
      mockCapacityWriteRepository.save.mockImplementation(async (capacity) => {
        savedCapacity = capacity;
      });

      // Act
      await handler.execute(command);

      // Assert
      expect(savedCapacity).toBeDefined();
      expect(savedCapacity!.getOfferingId().getValue()).toBe(offeringId);
      expect(savedCapacity!.getDate()).toEqual(date);
      expect(savedCapacity!.getTotalSlots()).toBe(totalSlots);
      expect(savedCapacity!.getAvailableSlots()).toBe(totalSlots);
      expect(savedCapacity!.getBookedSlots()).toBe(0);
    });
  });

  describe('when capacity already exists', () => {
    it('should update existing capacity', async () => {
      // Arrange
      const offeringId = UUID.generate().getValue();
      const date = new Date();
      date.setDate(date.getDate() + 7); // 7 días en el futuro
      const existingTotalSlots = 10;
      const newTotalSlots = 15;
      const command = new SetCapacityCommand(offeringId, date, newTotalSlots);

      // Crear capacidad existente
      const existingCapacity = Capacity.create(
        UUID.generate(),
        UUID.fromString(offeringId),
        date,
        existingTotalSlots,
      );
      const existingCapacityId = existingCapacity.getId().getValue();

      mockCapacityFactory.loadByOfferingAndDate.mockResolvedValue(existingCapacity);

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result.capacityId).toBe(existingCapacityId);
      expect(mockCapacityFactory.loadByOfferingAndDate).toHaveBeenCalledWith(offeringId, date);
      expect(mockCapacityWriteRepository.save).toHaveBeenCalledTimes(1);
      expect(mockUow.transaction).toHaveBeenCalledTimes(1);
    });

    it('should update capacity with correct new values', async () => {
      // Arrange
      const offeringId = UUID.generate().getValue();
      const date = new Date();
      date.setDate(date.getDate() + 7); // 7 días en el futuro
      const existingTotalSlots = 10;
      const newTotalSlots = 20;
      const command = new SetCapacityCommand(offeringId, date, newTotalSlots);

      // Crear capacidad existente
      const existingCapacity = Capacity.create(
        UUID.generate(),
        UUID.fromString(offeringId),
        date,
        existingTotalSlots,
      );

      mockCapacityFactory.loadByOfferingAndDate.mockResolvedValue(existingCapacity);

      let savedCapacity: Capacity | undefined;
      mockCapacityWriteRepository.save.mockImplementation(async (capacity) => {
        savedCapacity = capacity;
      });

      // Act
      await handler.execute(command);

      // Assert
      expect(savedCapacity).toBeDefined();
      expect(savedCapacity!.getTotalSlots()).toBe(newTotalSlots);
      expect(savedCapacity!.getAvailableSlots()).toBe(newTotalSlots); // Sin reservas, disponible = total
    });

    it('should preserve booked slots when updating capacity', async () => {
      // Arrange
      const offeringId = UUID.generate().getValue();
      const date = new Date();
      date.setDate(date.getDate() + 7); // 7 días en el futuro
      const existingTotalSlots = 10;
      const newTotalSlots = 15;
      const command = new SetCapacityCommand(offeringId, date, newTotalSlots);

      // Crear capacidad existente con slots reservados
      const existingCapacity = Capacity.create(
        UUID.generate(),
        UUID.fromString(offeringId),
        date,
        existingTotalSlots,
      );
      // Reservar 3 slots
      existingCapacity.bookSlot();
      existingCapacity.bookSlot();
      existingCapacity.bookSlot();

      mockCapacityFactory.loadByOfferingAndDate.mockResolvedValue(existingCapacity);

      let savedCapacity: Capacity | undefined;
      mockCapacityWriteRepository.save.mockImplementation(async (capacity) => {
        savedCapacity = capacity;
      });

      // Act
      await handler.execute(command);

      // Assert
      expect(savedCapacity).toBeDefined();
      expect(savedCapacity!.getTotalSlots()).toBe(newTotalSlots);
      expect(savedCapacity!.getBookedSlots()).toBe(3); // Slots reservados se mantienen
      expect(savedCapacity!.getAvailableSlots()).toBe(12); // 15 total - 3 reservados = 12 disponibles
    });
  });

  describe('error handling', () => {
    it('should throw error when trying to reduce capacity below booked slots', async () => {
      // Arrange
      const offeringId = UUID.generate().getValue();
      const date = new Date();
      date.setDate(date.getDate() + 7); // 7 días en el futuro
      const existingTotalSlots = 10;
      const newTotalSlots = 2; // Menos que los slots reservados
      const command = new SetCapacityCommand(offeringId, date, newTotalSlots);

      // Crear capacidad existente con 5 slots reservados
      const existingCapacity = Capacity.create(
        UUID.generate(),
        UUID.fromString(offeringId),
        date,
        existingTotalSlots,
      );
      existingCapacity.bookSlot();
      existingCapacity.bookSlot();
      existingCapacity.bookSlot();
      existingCapacity.bookSlot();
      existingCapacity.bookSlot();

      mockCapacityFactory.loadByOfferingAndDate.mockResolvedValue(existingCapacity);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        'Cannot reduce capacity below booked slots',
      );
    });

    it('should throw error when creating capacity with negative slots', async () => {
      // Arrange
      const offeringId = UUID.generate().getValue();
      const date = new Date();
      date.setDate(date.getDate() + 7); // 7 días en el futuro
      const totalSlots = -5;
      const command = new SetCapacityCommand(offeringId, date, totalSlots);

      mockCapacityFactory.loadByOfferingAndDate.mockResolvedValue(null);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow('Total slots cannot be negative');
    });

    it('should throw error when creating capacity for past date', async () => {
      // Arrange
      const offeringId = UUID.generate().getValue();
      const pastDate = new Date('2020-01-01');
      const totalSlots = 10;
      const command = new SetCapacityCommand(offeringId, pastDate, totalSlots);

      mockCapacityFactory.loadByOfferingAndDate.mockResolvedValue(null);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        'Cannot create capacity for past dates',
      );
    });
  });

  describe('transaction handling', () => {
    it('should execute within a transaction', async () => {
      // Arrange
      const offeringId = UUID.generate().getValue();
      const date = new Date();
      date.setDate(date.getDate() + 7); // 7 días en el futuro
      const totalSlots = 10;
      const command = new SetCapacityCommand(offeringId, date, totalSlots);

      mockCapacityFactory.loadByOfferingAndDate.mockResolvedValue(null);

      // Act
      await handler.execute(command);

      // Assert
      expect(mockUow.transaction).toHaveBeenCalledTimes(1);
      expect(mockUow.transaction).toHaveBeenCalledWith(expect.any(Function));
    });
  });
});

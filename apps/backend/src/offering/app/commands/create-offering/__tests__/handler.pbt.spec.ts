import { Test, TestingModule } from '@nestjs/testing';
import * as fc from 'fast-check';
import { CreateOfferingHandler } from '../handler';
import { CreateOfferingCommand } from '../command';
import { IOfferingWriteRepository } from '@offering/domain/interfaces/repositories/offering-write';
import { IOfferingFactory } from '@offering/domain/interfaces/factories/offering-factory';
import { Offering } from '@offering/domain/aggregates/offering';
import { DuplicateOfferingNameException } from '@offering/domain/exceptions/duplicate-offering-name';
import { InvalidOfferingDurationException } from '@offering/domain/exceptions/invalid-offering-duration';
import { InvalidOfferingCapacityException } from '@offering/domain/exceptions/invalid-offering-capacity';
import { UUID } from '@shared/vo/uuid';

// Custom UUID generator that produces valid UUIDs
const validUuidArbitrary = fc.string().map(() => UUID.generate().getValue());

// Duration generator that produces multiples of 15
const validDurationArbitrary = fc.integer({ min: 1, max: 32 }).map((n) => n * 15); // 15 to 480

describe('CreateOfferingHandler PBT', () => {
  let handler: CreateOfferingHandler;
  let writeRepository: jest.Mocked<IOfferingWriteRepository>;
  let factory: jest.Mocked<IOfferingFactory>;

  beforeEach(async () => {
    const mockWriteRepository = {
      save: jest.fn(),
    };

    const mockFactory = {
      loadById: jest.fn(),
      loadByBusinessIdAndName: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateOfferingHandler,
        {
          provide: 'IOfferingWriteRepository',
          useValue: mockWriteRepository,
        },
        {
          provide: 'IOfferingFactory',
          useValue: mockFactory,
        },
      ],
    }).compile();

    handler = module.get<CreateOfferingHandler>(CreateOfferingHandler);
    writeRepository = module.get('IOfferingWriteRepository');
    factory = module.get('IOfferingFactory');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Feature: offering-bc, Property 1: Name uniqueness
   * Validates: Requirements 7.1
   *
   * For any business and offering name, if an offering with that name already exists
   * for that business, creating a new offering with the same name should fail
   */
  it('should reject duplicate offering names for the same business', async () => {
    await fc.assert(
      fc.asyncProperty(
        validUuidArbitrary,
        fc.string({ minLength: 1, maxLength: 100 }),
        validDurationArbitrary,
        fc.integer({ min: 1, max: 20 }),
        fc.option(fc.integer({ min: 1, max: 100 }), { nil: null }),
        async (businessId, name, duration, capacity, dailyCapacity) => {
          // Clear mocks before each iteration
          jest.clearAllMocks();

          // Arrange - Simular que ya existe un offering con ese nombre
          factory.loadByBusinessIdAndName.mockResolvedValue({} as Offering);

          const command = new CreateOfferingCommand(
            businessId,
            name,
            duration,
            capacity,
            dailyCapacity,
          );

          // Act & Assert
          await expect(handler.execute(command)).rejects.toThrow(DuplicateOfferingNameException);
          expect(writeRepository.save).not.toHaveBeenCalled();
        },
      ),
      { numRuns: 10 }, // Reduce iterations for faster tests
    );
  });

  /**
   * Feature: offering-bc, Property 2: Duration validation
   * Validates: Requirements 1.2
   *
   * For any offering, the duration must be at least 15 minutes and at most 480 minutes (8 hours)
   */
  it('should reject offerings with duration less than 15 minutes', async () => {
    await fc.assert(
      fc.asyncProperty(
        validUuidArbitrary,
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.integer({ min: 1, max: 14 }), // Duración inválida
        fc.integer({ min: 1, max: 20 }),
        fc.option(fc.integer({ min: 1, max: 100 }), { nil: null }),
        async (businessId, name, invalidDuration, capacity, dailyCapacity) => {
          // Clear mocks before each iteration
          jest.clearAllMocks();

          // Arrange
          factory.loadByBusinessIdAndName.mockResolvedValue(null);

          const command = new CreateOfferingCommand(
            businessId,
            name,
            invalidDuration,
            capacity,
            dailyCapacity,
          );

          // Act & Assert
          await expect(handler.execute(command)).rejects.toThrow(InvalidOfferingDurationException);
          expect(writeRepository.save).not.toHaveBeenCalled();
        },
      ),
      { numRuns: 10 },
    );
  });

  it('should reject offerings with duration more than 480 minutes', async () => {
    await fc.assert(
      fc.asyncProperty(
        validUuidArbitrary,
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.integer({ min: 481, max: 1000 }), // Duración inválida
        fc.integer({ min: 1, max: 20 }),
        fc.option(fc.integer({ min: 1, max: 100 }), { nil: null }),
        async (businessId, name, invalidDuration, capacity, dailyCapacity) => {
          // Clear mocks before each iteration
          jest.clearAllMocks();

          // Arrange
          factory.loadByBusinessIdAndName.mockResolvedValue(null);

          const command = new CreateOfferingCommand(
            businessId,
            name,
            invalidDuration,
            capacity,
            dailyCapacity,
          );

          // Act & Assert
          await expect(handler.execute(command)).rejects.toThrow(InvalidOfferingDurationException);
          expect(writeRepository.save).not.toHaveBeenCalled();
        },
      ),
      { numRuns: 10 },
    );
  });

  /**
   * Feature: offering-bc, Property 3: Capacity validation
   * Validates: Requirements 1.3
   *
   * For any offering:
   * - maxCapacityPerSlot must be at least 1
   * - maxDailyCapacity (if set) must be >= maxCapacityPerSlot
   */
  it('should reject offerings with maxCapacityPerSlot less than 1', async () => {
    await fc.assert(
      fc.asyncProperty(
        validUuidArbitrary,
        fc.string({ minLength: 1, maxLength: 100 }),
        validDurationArbitrary,
        fc.integer({ min: -10, max: 0 }), // Capacidad inválida
        fc.option(fc.integer({ min: 1, max: 100 }), { nil: null }),
        async (businessId, name, duration, invalidCapacity, dailyCapacity) => {
          // Clear mocks before each iteration
          jest.clearAllMocks();

          // Arrange
          factory.loadByBusinessIdAndName.mockResolvedValue(null);

          const command = new CreateOfferingCommand(
            businessId,
            name,
            duration,
            invalidCapacity,
            dailyCapacity,
          );

          // Act & Assert
          await expect(handler.execute(command)).rejects.toThrow(InvalidOfferingCapacityException);
          expect(writeRepository.save).not.toHaveBeenCalled();
        },
      ),
      { numRuns: 10 },
    );
  });

  it('should reject offerings where maxDailyCapacity < maxCapacityPerSlot', async () => {
    await fc.assert(
      fc.asyncProperty(
        validUuidArbitrary,
        fc.string({ minLength: 1, maxLength: 100 }),
        validDurationArbitrary,
        fc.integer({ min: 5, max: 20 }),
        fc.integer({ min: 1, max: 4 }), // dailyCapacity < maxCapacityPerSlot
        async (businessId, name, duration, capacity, invalidDailyCapacity) => {
          // Clear mocks before each iteration
          jest.clearAllMocks();

          // Arrange
          factory.loadByBusinessIdAndName.mockResolvedValue(null);

          const command = new CreateOfferingCommand(
            businessId,
            name,
            duration,
            capacity,
            invalidDailyCapacity,
          );

          // Act & Assert
          await expect(handler.execute(command)).rejects.toThrow(InvalidOfferingCapacityException);
          expect(writeRepository.save).not.toHaveBeenCalled();
        },
      ),
      { numRuns: 10 },
    );
  });

  it('should create offering successfully with valid parameters', async () => {
    await fc.assert(
      fc.asyncProperty(
        validUuidArbitrary,
        fc.string({ minLength: 1, maxLength: 100 }),
        validDurationArbitrary,
        fc.integer({ min: 1, max: 20 }),
        fc.option(fc.integer({ min: 1, max: 100 }), { nil: null }),
        async (businessId, name, duration, capacity, dailyCapacity) => {
          // Clear mocks before each iteration
          jest.clearAllMocks();

          // Arrange
          factory.loadByBusinessIdAndName.mockResolvedValue(null);
          writeRepository.save.mockResolvedValue();

          // Asegurar que dailyCapacity >= capacity si no es null
          const validDailyCapacity =
            dailyCapacity !== null && dailyCapacity < capacity ? capacity : dailyCapacity;

          const command = new CreateOfferingCommand(
            businessId,
            name,
            duration,
            capacity,
            validDailyCapacity,
          );

          // Act
          const result = await handler.execute(command);

          // Assert
          expect(result).toHaveProperty('offeringId');
          expect(typeof result.offeringId).toBe('string');
          expect(writeRepository.save).toHaveBeenCalledTimes(1);

          const savedOffering = writeRepository.save.mock.calls[0][0] as Offering;
          expect(savedOffering.getName()).toBe(name);
          expect(savedOffering.getDuration().getMinutes()).toBe(duration);
          expect(savedOffering.getMaxCapacityPerSlot()).toBe(capacity);
          expect(savedOffering.getMaxDailyCapacity()).toBe(validDailyCapacity);
          expect(savedOffering.isActiveOffering()).toBe(true);
        },
      ),
      { numRuns: 10 },
    );
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { CreateOfferingHandler } from '../handler';
import { CreateOfferingCommand } from '../command';
import { IOfferingWriteRepository } from '@offering/domain/interfaces/repositories/offering-write';
import { IOfferingFactory } from '@offering/domain/interfaces/factories/offering-factory';
import { Offering } from '@offering/domain/aggregates/offering';
import { UUID } from '@shared/vo/uuid';
import { OfferingDuration } from '@offering/domain/vo/offering-duration';
import { DuplicateOfferingNameException } from '@offering/domain/exceptions/duplicate-offering-name';
import { InvalidOfferingDurationException } from '@offering/domain/exceptions/invalid-offering-duration';
import { InvalidOfferingCapacityException } from '@offering/domain/exceptions/invalid-offering-capacity';

describe('CreateOfferingHandler', () => {
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

  describe('execute', () => {
    it('should create offering correctly', async () => {
      // Arrange
      const businessId = UUID.generate();
      const command = new CreateOfferingCommand(businessId.getValue(), 'Corte de Pelo', 30, 4, 20);

      factory.loadByBusinessIdAndName.mockResolvedValue(null);
      writeRepository.save.mockResolvedValue();

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result).toHaveProperty('offeringId');
      expect(typeof result.offeringId).toBe('string');
      expect(factory.loadByBusinessIdAndName).toHaveBeenCalledWith(
        businessId.getValue(),
        'Corte de Pelo',
      );
      expect(writeRepository.save).toHaveBeenCalledTimes(1);

      const savedOffering = writeRepository.save.mock.calls[0][0] as Offering;
      expect(savedOffering.getName()).toBe('Corte de Pelo');
      expect(savedOffering.getDuration().getMinutes()).toBe(30);
      expect(savedOffering.getMaxCapacityPerSlot()).toBe(4);
      expect(savedOffering.getMaxDailyCapacity()).toBe(20);
      expect(savedOffering.isActiveOffering()).toBe(true);
    });

    it('should throw DuplicateOfferingNameException if name exists', async () => {
      // Arrange
      const businessId = UUID.generate();
      const command = new CreateOfferingCommand(businessId.getValue(), 'Corte de Pelo', 30, 4, 20);

      const existingOffering = Offering.fromPersistence(
        UUID.generate(),
        businessId,
        'Corte de Pelo',
        OfferingDuration.fromMinutes(30),
        4,
        20,
        true,
        1,
      );

      factory.loadByBusinessIdAndName.mockResolvedValue(existingOffering);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(DuplicateOfferingNameException);
      expect(writeRepository.save).not.toHaveBeenCalled();
    });

    it('should throw InvalidOfferingDurationException if duration is invalid', async () => {
      // Arrange
      const businessId = UUID.generate();
      const command = new CreateOfferingCommand(
        businessId.getValue(),
        'Corte de Pelo',
        10, // Duración inválida (< 15)
        4,
        20,
      );

      factory.loadByBusinessIdAndName.mockResolvedValue(null);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(InvalidOfferingDurationException);
      expect(writeRepository.save).not.toHaveBeenCalled();
    });

    it('should throw InvalidOfferingCapacityException if capacity is invalid', async () => {
      // Arrange
      const businessId = UUID.generate();
      const command = new CreateOfferingCommand(
        businessId.getValue(),
        'Corte de Pelo',
        30,
        0, // Capacidad inválida (< 1)
        20,
      );

      factory.loadByBusinessIdAndName.mockResolvedValue(null);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(InvalidOfferingCapacityException);
      expect(writeRepository.save).not.toHaveBeenCalled();
    });

    it('should create offering and increment version', async () => {
      // Arrange
      const businessId = UUID.generate();
      const command = new CreateOfferingCommand(businessId.getValue(), 'Corte de Pelo', 30, 4, 20);

      factory.loadByBusinessIdAndName.mockResolvedValue(null);
      writeRepository.save.mockResolvedValue();

      // Act
      await handler.execute(command);

      // Assert
      const savedOffering = writeRepository.save.mock.calls[0][0] as Offering;

      // Version should be incremented (starts at 0, incremented to 1)
      expect(savedOffering.getVersion().getValue()).toBe(1);

      // Note: Events are auto-published with autoCommit=true, so getUncommittedEvents() returns empty
      // The event was published, but we can't check it in unit tests without EventBus integration
    });

    it('should handle null maxDailyCapacity', async () => {
      // Arrange
      const businessId = UUID.generate();
      const command = new CreateOfferingCommand(
        businessId.getValue(),
        'Corte de Pelo',
        30,
        4,
        null, // Sin límite diario
      );

      factory.loadByBusinessIdAndName.mockResolvedValue(null);
      writeRepository.save.mockResolvedValue();

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result).toHaveProperty('offeringId');
      const savedOffering = writeRepository.save.mock.calls[0][0] as Offering;
      expect(savedOffering.getMaxDailyCapacity()).toBeNull();
    });
  });
});

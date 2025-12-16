import { Test, TestingModule } from '@nestjs/testing';
import { UpdateOfferingHandler } from '../handler';
import { UpdateOfferingCommand } from '../command';
import { IOfferingWriteRepository } from '@offering/domain/interfaces/repositories/offering-write';
import { IOfferingFactory } from '@offering/domain/interfaces/factories/offering-factory';
import { Offering } from '@offering/domain/aggregates/offering';
import { UUID } from '@shared/vo/uuid';
import { OfferingDuration } from '@offering/domain/vo/offering-duration';
import { OfferingNotFoundException } from '@offering/domain/exceptions/offering-not-found';
import { OfferingNotFoundForBusinessException } from '@offering/domain/exceptions/offering-not-found-for-business';
import { DuplicateOfferingNameException } from '@offering/domain/exceptions/duplicate-offering-name';
import { ConcurrencyException } from '@shared/kernel/exceptions/concurrency';

describe('UpdateOfferingHandler', () => {
  let handler: UpdateOfferingHandler;
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
        UpdateOfferingHandler,
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

    handler = module.get<UpdateOfferingHandler>(UpdateOfferingHandler);
    writeRepository = module.get('IOfferingWriteRepository');
    factory = module.get('IOfferingFactory');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should update offering correctly', async () => {
      // Arrange
      const offeringId = UUID.generate();
      const businessId = UUID.generate();

      const existingOffering = Offering.fromPersistence(
        offeringId,
        businessId,
        'Corte de Pelo',
        OfferingDuration.fromMinutes(30),
        4,
        20,
        true,
        1,
      );

      const command = new UpdateOfferingCommand(
        offeringId.getValue(),
        businessId.getValue(),
        'Corte Premium',
        45,
        6,
        30,
      );

      factory.loadById.mockResolvedValue(existingOffering);
      factory.loadByBusinessIdAndName.mockResolvedValue(null);
      writeRepository.save.mockResolvedValue();

      // Act
      await handler.execute(command);

      // Assert
      expect(factory.loadById).toHaveBeenCalledWith(offeringId.getValue());
      expect(factory.loadByBusinessIdAndName).toHaveBeenCalledWith(businessId.getValue(), 'Corte Premium');
      expect(writeRepository.save).toHaveBeenCalledTimes(1);

      const savedOffering = writeRepository.save.mock.calls[0][0] as Offering;
      expect(savedOffering.getName()).toBe('Corte Premium');
      expect(savedOffering.getDuration().getMinutes()).toBe(45);
      expect(savedOffering.getMaxCapacityPerSlot()).toBe(6);
      expect(savedOffering.getMaxDailyCapacity()).toBe(30);
    });

    it('should throw OfferingNotFoundForBusinessException if businessId does not match', async () => {
      // Arrange
      const offeringId = UUID.generate();
      const businessId = UUID.generate();
      const differentBusinessId = UUID.generate();

      const existingOffering = Offering.fromPersistence(
        offeringId,
        businessId,
        'Corte de Pelo',
        OfferingDuration.fromMinutes(30),
        4,
        20,
        true,
        1,
      );

      const command = new UpdateOfferingCommand(
        offeringId.getValue(),
        differentBusinessId.getValue(),
        'Corte Premium',
        45,
        6,
        30,
      );

      factory.loadById.mockResolvedValue(existingOffering);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(OfferingNotFoundForBusinessException);
      expect(writeRepository.save).not.toHaveBeenCalled();
    });

    it('should throw DuplicateOfferingNameException if name is duplicated', async () => {
      // Arrange
      const offeringId = UUID.generate();
      const businessId = UUID.generate();

      const existingOffering = Offering.fromPersistence(
        offeringId,
        businessId,
        'Corte de Pelo',
        OfferingDuration.fromMinutes(30),
        4,
        20,
        true,
        1,
      );

      const anotherOffering = Offering.fromPersistence(
        UUID.generate(),
        businessId,
        'Corte Premium',
        OfferingDuration.fromMinutes(45),
        6,
        30,
        true,
        1,
      );

      const command = new UpdateOfferingCommand(
        offeringId.getValue(),
        businessId.getValue(),
        'Corte Premium', // Nombre que ya existe en otro offering
        45,
        6,
        30,
      );

      factory.loadById.mockResolvedValue(existingOffering);
      factory.loadByBusinessIdAndName.mockResolvedValue(anotherOffering);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(DuplicateOfferingNameException);
      expect(writeRepository.save).not.toHaveBeenCalled();
    });

    it('should update offering and increment version', async () => {
      // Arrange
      const offeringId = UUID.generate();
      const businessId = UUID.generate();

      const existingOffering = Offering.fromPersistence(
        offeringId,
        businessId,
        'Corte de Pelo',
        OfferingDuration.fromMinutes(30),
        4,
        20,
        true,
        1,
      );

      const command = new UpdateOfferingCommand(
        offeringId.getValue(),
        businessId.getValue(),
        'Corte Premium',
        45,
        6,
        30,
      );

      factory.loadById.mockResolvedValue(existingOffering);
      factory.loadByBusinessIdAndName.mockResolvedValue(null);
      writeRepository.save.mockResolvedValue();

      // Act
      await handler.execute(command);

      // Assert
      const savedOffering = writeRepository.save.mock.calls[0][0] as Offering;

      // Version should be incremented (from 1 to 2)
      expect(savedOffering.getVersion().getValue()).toBe(2);
      
      // Note: Events are auto-published with autoCommit=true, so getUncommittedEvents() returns empty
      // The event was published, but we can't check it in unit tests without EventBus integration
    });

    it('should handle ConcurrencyException with retry', async () => {
      // Arrange
      const offeringId = UUID.generate();
      const businessId = UUID.generate();

      const existingOffering = Offering.fromPersistence(
        offeringId,
        businessId,
        'Corte de Pelo',
        OfferingDuration.fromMinutes(30),
        4,
        20,
        true,
        1,
      );

      const command = new UpdateOfferingCommand(
        offeringId.getValue(),
        businessId.getValue(),
        'Corte Premium',
        45,
        6,
        30,
      );

      factory.loadById.mockResolvedValue(existingOffering);
      factory.loadByBusinessIdAndName.mockResolvedValue(null);

      // Primera llamada falla con ConcurrencyException, segunda tiene éxito
      writeRepository.save
        .mockRejectedValueOnce(new ConcurrencyException('Version mismatch'))
        .mockResolvedValueOnce();

      // Act
      await handler.execute(command);

      // Assert
      expect(writeRepository.save).toHaveBeenCalledTimes(2);
    });

    it('should throw error after max retries on ConcurrencyException', async () => {
      // Arrange
      const offeringId = UUID.generate();
      const businessId = UUID.generate();

      const existingOffering = Offering.fromPersistence(
        offeringId,
        businessId,
        'Corte de Pelo',
        OfferingDuration.fromMinutes(30),
        4,
        20,
        true,
        1,
      );

      const command = new UpdateOfferingCommand(
        offeringId.getValue(),
        businessId.getValue(),
        'Corte Premium',
        45,
        6,
        30,
      );

      factory.loadById.mockResolvedValue(existingOffering);
      factory.loadByBusinessIdAndName.mockResolvedValue(null);

      // Todas las llamadas fallan con ConcurrencyException
      writeRepository.save.mockRejectedValue(new ConcurrencyException('Version mismatch'));

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        'Unable to update offering after multiple attempts',
      );
      expect(writeRepository.save).toHaveBeenCalledTimes(3); // MAX_RETRIES
    });

    it('should allow updating to same name', async () => {
      // Arrange
      const offeringId = UUID.generate();
      const businessId = UUID.generate();

      const existingOffering = Offering.fromPersistence(
        offeringId,
        businessId,
        'Corte de Pelo',
        OfferingDuration.fromMinutes(30),
        4,
        20,
        true,
        1,
      );

      const command = new UpdateOfferingCommand(
        offeringId.getValue(),
        businessId.getValue(),
        'Corte de Pelo', // Mismo nombre
        45,
        6,
        30,
      );

      factory.loadById.mockResolvedValue(existingOffering);
      factory.loadByBusinessIdAndName.mockResolvedValue(existingOffering); // Retorna el mismo offering
      writeRepository.save.mockResolvedValue();

      // Act
      await handler.execute(command);

      // Assert
      expect(writeRepository.save).toHaveBeenCalledTimes(1);
    });
  });
});

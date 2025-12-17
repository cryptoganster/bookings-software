import { Test, TestingModule } from '@nestjs/testing';
import { DeactivateOfferingHandler } from '../handler';
import { DeactivateOfferingCommand } from '../command';
import { IOfferingWriteRepository } from '@offering/domain/interfaces/repositories/offering-write';
import { IOfferingFactory } from '@offering/domain/interfaces/factories/offering-factory';
import { Offering } from '@offering/domain/aggregates/offering';
import { UUID } from '@shared/vo/uuid';
import { OfferingDuration } from '@offering/domain/vo/offering-duration';
import { OfferingNotFoundException } from '@offering/domain/exceptions/offering-not-found';
import { OfferingNotFoundForBusinessException } from '@offering/domain/exceptions/offering-not-found-for-business';

describe('DeactivateOfferingHandler', () => {
  let handler: DeactivateOfferingHandler;
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
        DeactivateOfferingHandler,
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

    handler = module.get<DeactivateOfferingHandler>(DeactivateOfferingHandler);
    writeRepository = module.get('IOfferingWriteRepository');
    factory = module.get('IOfferingFactory');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should deactivate offering correctly', async () => {
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
        true, // Activo
        1,
      );

      const command = new DeactivateOfferingCommand(offeringId.getValue(), businessId.getValue());

      factory.loadById.mockResolvedValue(existingOffering);
      writeRepository.save.mockResolvedValue();

      // Act
      await handler.execute(command);

      // Assert
      expect(factory.loadById).toHaveBeenCalledWith(offeringId.getValue());
      expect(writeRepository.save).toHaveBeenCalledTimes(1);

      const savedOffering = writeRepository.save.mock.calls[0][0] as Offering;
      expect(savedOffering.isActiveOffering()).toBe(false);
    });

    it('should throw OfferingNotFoundException if offering does not exist', async () => {
      // Arrange
      const offeringId = UUID.generate();
      const businessId = UUID.generate();
      const command = new DeactivateOfferingCommand(offeringId.getValue(), businessId.getValue());

      factory.loadById.mockResolvedValue(null);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(OfferingNotFoundException);
      expect(writeRepository.save).not.toHaveBeenCalled();
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

      const command = new DeactivateOfferingCommand(
        offeringId.getValue(),
        differentBusinessId.getValue(),
      );

      factory.loadById.mockResolvedValue(existingOffering);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(OfferingNotFoundForBusinessException);
      expect(writeRepository.save).not.toHaveBeenCalled();
    });

    it('should deactivate offering and increment version', async () => {
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

      const command = new DeactivateOfferingCommand(offeringId.getValue(), businessId.getValue());

      factory.loadById.mockResolvedValue(existingOffering);
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
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { ActivateOfferingHandler } from '../handler';
import { ActivateOfferingCommand } from '../command';
import { IOfferingWriteRepository } from '@offering/domain/interfaces/repositories/offering-write';
import { IOfferingFactory } from '@offering/domain/interfaces/factories/offering-factory';
import { Offering } from '@offering/domain/aggregates/offering';
import { UUID } from '@shared/vo/uuid';
import { OfferingDuration } from '@offering/domain/vo/offering-duration';
import { OfferingNotFoundException } from '@offering/domain/exceptions/offering-not-found';
import { OfferingNotFoundForBusinessException } from '@offering/domain/exceptions/offering-not-found-for-business';

describe('ActivateOfferingHandler', () => {
  let handler: ActivateOfferingHandler;
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
        ActivateOfferingHandler,
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

    handler = module.get<ActivateOfferingHandler>(ActivateOfferingHandler);
    writeRepository = module.get('IOfferingWriteRepository');
    factory = module.get('IOfferingFactory');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should activate offering correctly', async () => {
      // Arrange
      const offeringId = UUID.generate();
      const businessId = UUID.fromString('business-123');

      const existingOffering = Offering.fromPersistence(
        offeringId,
        businessId,
        'Corte de Pelo',
        OfferingDuration.fromMinutes(30),
        4,
        20,
        false, // Inactivo
        1,
      );

      const command = new ActivateOfferingCommand(
        offeringId.getValue(),
        businessId.getValue(),
      );

      factory.loadById.mockResolvedValue(existingOffering);
      writeRepository.save.mockResolvedValue();

      // Act
      await handler.execute(command);

      // Assert
      expect(factory.loadById).toHaveBeenCalledWith(offeringId.getValue());
      expect(writeRepository.save).toHaveBeenCalledTimes(1);

      const savedOffering = writeRepository.save.mock.calls[0][0] as Offering;
      expect(savedOffering.isActiveOffering()).toBe(true);
    });

    it('should throw OfferingNotFoundException if offering does not exist', async () => {
      // Arrange
      const command = new ActivateOfferingCommand('offering-123', 'business-123');

      factory.loadById.mockResolvedValue(null);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(OfferingNotFoundException);
      expect(writeRepository.save).not.toHaveBeenCalled();
    });

    it('should throw OfferingNotFoundForBusinessException if businessId does not match', async () => {
      // Arrange
      const offeringId = UUID.generate();
      const businessId = UUID.fromString('business-123');
      const differentBusinessId = 'business-456';

      const existingOffering = Offering.fromPersistence(
        offeringId,
        businessId,
        'Corte de Pelo',
        OfferingDuration.fromMinutes(30),
        4,
        20,
        false,
        1,
      );

      const command = new ActivateOfferingCommand(
        offeringId.getValue(),
        differentBusinessId,
      );

      factory.loadById.mockResolvedValue(existingOffering);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(OfferingNotFoundForBusinessException);
      expect(writeRepository.save).not.toHaveBeenCalled();
    });

    it('should publish OfferingActivated event', async () => {
      // Arrange
      const offeringId = UUID.generate();
      const businessId = UUID.fromString('business-123');

      const existingOffering = Offering.fromPersistence(
        offeringId,
        businessId,
        'Corte de Pelo',
        OfferingDuration.fromMinutes(30),
        4,
        20,
        false,
        1,
      );

      const command = new ActivateOfferingCommand(
        offeringId.getValue(),
        businessId.getValue(),
      );

      factory.loadById.mockResolvedValue(existingOffering);
      writeRepository.save.mockResolvedValue();

      // Act
      await handler.execute(command);

      // Assert
      const savedOffering = writeRepository.save.mock.calls[0][0] as Offering;
      const uncommittedEvents = savedOffering.getUncommittedEvents();

      expect(uncommittedEvents).toHaveLength(1);
      expect(uncommittedEvents[0].constructor.name).toBe('OfferingActivated');
    });
  });
});

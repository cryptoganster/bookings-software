import { Test, TestingModule } from '@nestjs/testing';
import { ConfigureWhatsAppHandler } from '../handler';
import { ConfigureWhatsAppCommand } from '../command';
import { IBusinessFactory } from '@business/domain/interfaces/factories/business-factory';
import { IBusinessWriteRepository } from '@business/domain/interfaces/repositories/business-write';
import { IBusinessUniquenessChecker } from '@business/domain/interfaces/services/business-uniqueness-checker.interface';
import { BusinessNotFoundException } from '@business/domain/exceptions/business-not-found';
import { WhatsAppPhoneAlreadyExistsException } from '@shared/kernel/exceptions/whatsapp-phone-already-exists';
import { WhatsAppPhone } from '@shared/vo/whatsapp-phone';
import { Business } from '@business/domain/aggregates/business';

/**
 * Unit tests for ConfigureWhatsAppHandler
 *
 * Tests the command handler for configuring WhatsApp phone number.
 * Validates:
 * - Business existence check
 * - WhatsApp phone uniqueness validation (excluding current business)
 * - Aggregate method invocation
 * - Persistence
 *
 * **Validates: Requirements 1.1, 1.5, 2.4, 3.2**
 * **Property 1: WhatsAppPhone global uniqueness**
 */
describe('ConfigureWhatsAppHandler', () => {
  let handler: ConfigureWhatsAppHandler;
  let mockFactory: jest.Mocked<IBusinessFactory>;
  let mockWriteRepository: jest.Mocked<IBusinessWriteRepository>;
  let mockUniquenessChecker: jest.Mocked<IBusinessUniquenessChecker>;

  const businessId = '550e8400-e29b-41d4-a716-446655440000';
  const whatsappPhone = '+18095551234';

  beforeEach(async () => {
    // Create mocks
    mockFactory = {
      loadById: jest.fn(),
    } as jest.Mocked<IBusinessFactory>;

    mockWriteRepository = {
      save: jest.fn(),
    } as jest.Mocked<IBusinessWriteRepository>;

    mockUniquenessChecker = {
      isWhatsAppPhoneUnique: jest.fn(),
    } as jest.Mocked<IBusinessUniquenessChecker>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConfigureWhatsAppHandler,
        {
          provide: 'IBusinessFactory',
          useValue: mockFactory,
        },
        {
          provide: 'IBusinessWriteRepository',
          useValue: mockWriteRepository,
        },
        {
          provide: 'IBusinessUniquenessChecker',
          useValue: mockUniquenessChecker,
        },
      ],
    }).compile();

    handler = module.get<ConfigureWhatsAppHandler>(ConfigureWhatsAppHandler);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should configure WhatsApp phone successfully', async () => {
      // Arrange
      const mockBusiness = {
        configureWhatsApp: jest.fn(),
      };
      mockFactory.loadById.mockResolvedValue(mockBusiness as unknown as Business);
      mockUniquenessChecker.isWhatsAppPhoneUnique.mockResolvedValue(true);

      const command = new ConfigureWhatsAppCommand(businessId, whatsappPhone);

      // Act
      await handler.execute(command);

      // Assert
      expect(mockFactory.loadById).toHaveBeenCalledWith(businessId);
      expect(mockUniquenessChecker.isWhatsAppPhoneUnique).toHaveBeenCalledWith(
        whatsappPhone,
        businessId, // ← Should pass businessId to exclude from uniqueness check
      );
      expect(mockBusiness.configureWhatsApp).toHaveBeenCalledWith(expect.any(WhatsAppPhone));
      expect(mockWriteRepository.save).toHaveBeenCalledWith(mockBusiness);
    });

    it('should throw BusinessNotFoundException when business not found', async () => {
      // Arrange
      mockFactory.loadById.mockResolvedValue(null);

      const command = new ConfigureWhatsAppCommand(businessId, whatsappPhone);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(BusinessNotFoundException);
      expect(mockFactory.loadById).toHaveBeenCalledWith(businessId);
      expect(mockUniquenessChecker.isWhatsAppPhoneUnique).not.toHaveBeenCalled();
      expect(mockWriteRepository.save).not.toHaveBeenCalled();
    });

    it('should throw WhatsAppPhoneAlreadyExistsException when phone is not unique', async () => {
      // Arrange
      const mockBusiness = {
        configureWhatsApp: jest.fn(),
      };
      mockFactory.loadById.mockResolvedValue(mockBusiness as unknown as Business);
      mockUniquenessChecker.isWhatsAppPhoneUnique.mockResolvedValue(false);

      const command = new ConfigureWhatsAppCommand(businessId, whatsappPhone);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(WhatsAppPhoneAlreadyExistsException);
      expect(mockFactory.loadById).toHaveBeenCalledWith(businessId);
      expect(mockUniquenessChecker.isWhatsAppPhoneUnique).toHaveBeenCalledWith(
        whatsappPhone,
        businessId,
      );
      expect(mockBusiness.configureWhatsApp).not.toHaveBeenCalled();
      expect(mockWriteRepository.save).not.toHaveBeenCalled();
    });

    it('should pass businessId to uniqueness checker for update scenario', async () => {
      // Arrange
      const mockBusiness = {
        configureWhatsApp: jest.fn(),
      };
      mockFactory.loadById.mockResolvedValue(mockBusiness as unknown as Business);
      mockUniquenessChecker.isWhatsAppPhoneUnique.mockResolvedValue(true);

      const command = new ConfigureWhatsAppCommand(businessId, whatsappPhone);

      // Act
      await handler.execute(command);

      // Assert - Verify businessId is passed to exclude current business from check
      expect(mockUniquenessChecker.isWhatsAppPhoneUnique).toHaveBeenCalledWith(
        whatsappPhone,
        businessId,
      );
    });

    it('should call factory.loadById with correct businessId', async () => {
      // Arrange
      const mockBusiness = {
        configureWhatsApp: jest.fn(),
      };
      mockFactory.loadById.mockResolvedValue(mockBusiness as unknown as Business);
      mockUniquenessChecker.isWhatsAppPhoneUnique.mockResolvedValue(true);

      const command = new ConfigureWhatsAppCommand(businessId, whatsappPhone);

      // Act
      await handler.execute(command);

      // Assert
      expect(mockFactory.loadById).toHaveBeenCalledTimes(1);
      expect(mockFactory.loadById).toHaveBeenCalledWith(businessId);
    });

    it('should call business.configureWhatsApp with WhatsAppPhone value object', async () => {
      // Arrange
      const mockBusiness = {
        configureWhatsApp: jest.fn(),
      };
      mockFactory.loadById.mockResolvedValue(mockBusiness as unknown as Business);
      mockUniquenessChecker.isWhatsAppPhoneUnique.mockResolvedValue(true);

      const command = new ConfigureWhatsAppCommand(businessId, whatsappPhone);

      // Act
      await handler.execute(command);

      // Assert
      expect(mockBusiness.configureWhatsApp).toHaveBeenCalledTimes(1);
      const calledWith = mockBusiness.configureWhatsApp.mock.calls[0][0];
      expect(calledWith).toBeInstanceOf(WhatsAppPhone);
      expect(calledWith.getValue()).toBe(whatsappPhone);
    });

    it('should persist business after configuration', async () => {
      // Arrange
      const mockBusiness = {
        configureWhatsApp: jest.fn(),
      };
      mockFactory.loadById.mockResolvedValue(mockBusiness as unknown as Business);
      mockUniquenessChecker.isWhatsAppPhoneUnique.mockResolvedValue(true);

      const command = new ConfigureWhatsAppCommand(businessId, whatsappPhone);

      // Act
      await handler.execute(command);

      // Assert
      expect(mockWriteRepository.save).toHaveBeenCalledTimes(1);
      expect(mockWriteRepository.save).toHaveBeenCalledWith(mockBusiness);
    });

    it('should validate uniqueness before configuring', async () => {
      // Arrange
      const mockBusiness = {
        configureWhatsApp: jest.fn(),
      };
      mockFactory.loadById.mockResolvedValue(mockBusiness as unknown as Business);
      mockUniquenessChecker.isWhatsAppPhoneUnique.mockResolvedValue(true);

      const command = new ConfigureWhatsAppCommand(businessId, whatsappPhone);

      // Act
      await handler.execute(command);

      // Assert - Verify order of operations
      const loadCall = mockFactory.loadById.mock.invocationCallOrder[0];
      const uniquenessCall =
        mockUniquenessChecker.isWhatsAppPhoneUnique.mock.invocationCallOrder[0];
      const configureCall = mockBusiness.configureWhatsApp.mock.invocationCallOrder[0];
      const saveCall = mockWriteRepository.save.mock.invocationCallOrder[0];

      expect(loadCall).toBeLessThan(uniquenessCall);
      expect(uniquenessCall).toBeLessThan(configureCall);
      expect(configureCall).toBeLessThan(saveCall);
    });

    it('should use domain service instead of read repository', async () => {
      // Arrange
      const mockBusiness = {
        configureWhatsApp: jest.fn(),
      };
      mockFactory.loadById.mockResolvedValue(mockBusiness as unknown as Business);
      mockUniquenessChecker.isWhatsAppPhoneUnique.mockResolvedValue(true);

      const command = new ConfigureWhatsAppCommand(businessId, whatsappPhone);

      // Act
      await handler.execute(command);

      // Assert - Verify architecture compliance
      expect(mockUniquenessChecker.isWhatsAppPhoneUnique).toHaveBeenCalled();
      // Handler should NOT have any read repository injected
      expect((handler as { readRepository?: unknown }).readRepository).toBeUndefined();
    });
  });
});

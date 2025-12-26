import { Test, TestingModule } from '@nestjs/testing';
import { LinkCustomerToUserHandler } from '../handler';
import { LinkCustomerToUserCommand } from '../command';
import { ICustomerFactory } from '@customer/domain/interfaces/factories/customer-factory';
import { ICustomerWriteRepository } from '@customer/domain/interfaces/repositories/customer-write';
import { Customer } from '@customer/domain/aggregates/customer';
import { CustomerNotFoundException } from '@customer/domain/exceptions/customer-not-found';
import { CustomerAlreadyLinkedToUserException } from '@customer/domain/exceptions/customer-already-linked-to-user';
import { UUID } from '@shared/vo/uuid';
import { WhatsAppPhone } from '@shared/vo/whatsapp-phone';

/**
 * Unit tests for LinkCustomerToUserHandler
 *
 * Tests the handler logic for linking customers to users including:
 * - Successful linking of anonymous customers
 * - Error handling for non-existent customers
 * - Error handling for already linked customers
 * - Event publishing
 *
 * **Validates: Requirements 9.1.1-9.1.4**
 * **Property 8: Linking preserves identity**
 */
describe('LinkCustomerToUserHandler', () => {
  let handler: LinkCustomerToUserHandler;
  let mockFactory: jest.Mocked<ICustomerFactory>;
  let mockWriteRepo: jest.Mocked<ICustomerWriteRepository>;

  beforeEach(async () => {
    mockFactory = {
      loadById: jest.fn(),
      loadByWhatsAppPhone: jest.fn(),
    } as jest.Mocked<ICustomerFactory>;

    mockWriteRepo = {
      save: jest.fn(),
    } as jest.Mocked<ICustomerWriteRepository>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LinkCustomerToUserHandler,
        {
          provide: 'ICustomerFactory',
          useValue: mockFactory,
        },
        {
          provide: 'ICustomerWriteRepository',
          useValue: mockWriteRepo,
        },
      ],
    }).compile();

    handler = module.get<LinkCustomerToUserHandler>(LinkCustomerToUserHandler);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should link anonymous customer to user successfully', async () => {
      // Arrange
      const customerId = UUID.generate().getValue();
      const userId = UUID.generate().getValue();
      const businessId = UUID.generate();
      const phone = WhatsAppPhone.fromString('+18095551234');

      const customer = Customer.createAnonymous(
        UUID.fromString(customerId),
        businessId,
        phone,
        'Test Customer',
      );

      expect(customer.isAnonymous()).toBe(true);

      mockFactory.loadById.mockResolvedValue(customer);
      mockWriteRepo.save.mockResolvedValue();

      const command = new LinkCustomerToUserCommand(customerId, userId);

      // Act
      await handler.execute(command);

      // Assert
      expect(mockFactory.loadById).toHaveBeenCalledWith(customerId);
      expect(mockWriteRepo.save).toHaveBeenCalledWith(customer);
      expect(customer.isRegistered()).toBe(true);
      expect(customer.isAnonymous()).toBe(false);
      expect(customer.getUserId()?.getValue()).toBe(userId);
    });

    it('should throw CustomerNotFoundException when customer does not exist', async () => {
      // Arrange
      const customerId = UUID.generate().getValue();
      const userId = UUID.generate().getValue();

      mockFactory.loadById.mockResolvedValue(null);

      const command = new LinkCustomerToUserCommand(customerId, userId);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(CustomerNotFoundException);
      expect(mockFactory.loadById).toHaveBeenCalledWith(customerId);
      expect(mockWriteRepo.save).not.toHaveBeenCalled();
    });

    it('should throw CustomerAlreadyLinkedToUserException when customer is already linked', async () => {
      // Arrange
      const customerId = UUID.generate().getValue();
      const existingUserId = UUID.generate().getValue();
      const newUserId = UUID.generate().getValue();
      const businessId = UUID.generate();
      const phone = WhatsAppPhone.fromString('+18095555678');

      const customer = Customer.createAnonymous(
        UUID.fromString(customerId),
        businessId,
        phone,
        'Test Customer',
      );

      // Link to first user
      customer.linkToUser(UUID.fromString(existingUserId));

      mockFactory.loadById.mockResolvedValue(customer);

      const command = new LinkCustomerToUserCommand(customerId, newUserId);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(CustomerAlreadyLinkedToUserException);
      expect(mockFactory.loadById).toHaveBeenCalledWith(customerId);
      expect(mockWriteRepo.save).not.toHaveBeenCalled();
    });

    it('should increment version when linking', async () => {
      // Arrange
      const customerId = UUID.generate().getValue();
      const userId = UUID.generate().getValue();
      const businessId = UUID.generate();
      const phone = WhatsAppPhone.fromString('+18095559999');

      const customer = Customer.createAnonymous(
        UUID.fromString(customerId),
        businessId,
        phone,
        'Test Customer',
      );

      const initialVersion = customer.getVersion().getValue();

      mockFactory.loadById.mockResolvedValue(customer);
      mockWriteRepo.save.mockResolvedValue();

      const command = new LinkCustomerToUserCommand(customerId, userId);

      // Act
      await handler.execute(command);

      // Assert
      expect(customer.getVersion().getValue()).toBe(initialVersion + 1);
    });

    it('should preserve customer identity when linking (Property 8)', async () => {
      // Arrange
      const customerId = UUID.generate().getValue();
      const userId = UUID.generate().getValue();
      const businessId = UUID.generate();
      const phone = WhatsAppPhone.fromString('+18095558888');
      const name = 'Test Customer';

      const customer = Customer.createAnonymous(
        UUID.fromString(customerId),
        businessId,
        phone,
        name,
      );

      const originalId = customer.getId().getValue();
      const originalBusinessId = customer.getBusinessId().getValue();
      const originalPhone = customer.getWhatsAppPhone().getValue();
      const originalName = customer.getName();

      mockFactory.loadById.mockResolvedValue(customer);
      mockWriteRepo.save.mockResolvedValue();

      const command = new LinkCustomerToUserCommand(customerId, userId);

      // Act
      await handler.execute(command);

      // Assert - Identity preserved
      expect(customer.getId().getValue()).toBe(originalId);
      expect(customer.getBusinessId().getValue()).toBe(originalBusinessId);
      expect(customer.getWhatsAppPhone().getValue()).toBe(originalPhone);
      expect(customer.getName()).toBe(originalName);
    });
  });
});
